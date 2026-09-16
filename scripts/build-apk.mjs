#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bumpPatch,
  compareSemver,
  formatSemver,
  parseApkFileVersion,
  parseSemver,
  versionCode,
} from "./apk-version.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(root, "android");
const distDir = path.join(root, "dist");
const envPath = path.join(root, ".env");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    debug: false,
    skipWeb: false,
    bump: false,
    version: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--debug") options.debug = true;
    else if (arg === "--skip-web") options.skipWeb = true;
    else if (arg === "--bump") options.bump = true;
    else if (arg === "--version") {
      options.version = argv[i + 1];
      i += 1;
      if (!options.version) fail("--version requires X.Y.Z");
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }
  if (options.bump && options.version) {
    fail("--version and --bump are mutually exclusive");
  }
  return options;
}

function readEnvFile() {
  if (!fs.existsSync(envPath)) return {};
  const values = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    values[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return values;
}

function upsertEnv(key, value) {
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const pattern = new RegExp(`^${key}=.*$`, "m");
  const next = pattern.test(current)
    ? current.replace(pattern, `${key}=${value}`)
    : `${current.trimEnd()}${current.trim() ? "\n" : ""}${key}=${value}\n`;
  fs.writeFileSync(envPath, next.endsWith("\n") ? next : `${next}\n`);
}

function run(command, args, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed`);
  }
}

function firstExisting(candidates) {
  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function resolveJavaHome() {
  const fromEnv = process.env.JAVA_HOME;
  const studioWin = "C:\\Program Files\\Android\\Android Studio\\jbr";
  const found = firstExisting([
    fromEnv,
    studioWin,
    "/usr/lib/jvm/java-21-openjdk-amd64",
    "/usr/lib/jvm/java-17-openjdk-amd64",
  ]);
  if (found) return found;
  const probe = spawnSync("java", ["-version"], { encoding: "utf8" });
  if (probe.status === 0) return process.env.JAVA_HOME || "";
  fail(
    "JDK not found. Install JDK 21 and set JAVA_HOME (Temurin does not always put java on PATH).",
  );
}

function resolveAndroidSdk() {
  const home = os.homedir();
  const found = firstExisting([
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(home, "AppData", "Local", "Android", "Sdk"),
    path.join(home, "Library", "Android", "sdk"),
    path.join(home, "Android", "Sdk"),
    "/usr/lib/android-sdk",
    "/opt/android-sdk",
  ]);
  if (!found) {
    fail(
      "Android SDK not found. Set ANDROID_HOME (or ANDROID_SDK_ROOT) to the SDK directory.",
    );
  }
  return found;
}

function writeLocalProperties(sdkDir) {
  const escaped = sdkDir.replace(/\\/g, "/");
  fs.writeFileSync(path.join(androidDir, "local.properties"), `sdk.dir=${escaped}\n`);
}

function resolveSigning(debug) {
  if (debug) return { ok: true, source: "debug" };
  const envPathValue = process.env.ANDROID_KEYSTORE_PATH;
  const envPassword = process.env.ANDROID_KEYSTORE_PASSWORD;
  const envAlias = process.env.ANDROID_KEY_ALIAS;
  const envKeyPassword = process.env.ANDROID_KEY_PASSWORD;
  if (envPathValue && envPassword && envAlias && envKeyPassword) {
    if (!fs.existsSync(envPathValue)) {
      fail(`ANDROID_KEYSTORE_PATH does not exist: ${envPathValue}`);
    }
    return { ok: true, source: "env" };
  }
  const propertiesFile = path.join(androidDir, "keystore.properties");
  if (!fs.existsSync(propertiesFile)) {
    fail(
      "Release signing is not configured. Create android/keystore.properties (see android/keystore.properties.example) or set ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, and ANDROID_KEY_PASSWORD. For a debug APK, pass --debug.",
    );
  }
  const props = Object.fromEntries(
    fs
      .readFileSync(propertiesFile, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.includes("="))
      .map((line) => {
        const eq = line.indexOf("=");
        return [line.slice(0, eq).trim(), line.slice(eq + 1).trim()];
      }),
  );
  for (const key of ["storeFile", "storePassword", "keyAlias", "keyPassword"]) {
    if (!props[key]) fail(`android/keystore.properties is missing ${key}`);
  }
  if (!fs.existsSync(props.storeFile) && !fs.existsSync(path.join(androidDir, props.storeFile))) {
    fail(`Keystore file not found: ${props.storeFile}`);
  }
  return { ok: true, source: "file" };
}

function lastDistVersion() {
  if (!fs.existsSync(distDir)) return null;
  const versions = fs
    .readdirSync(distDir)
    .map(parseApkFileVersion)
    .filter(Boolean);
  if (versions.length === 0) return null;
  return versions.sort(compareSemver).at(-1);
}

function latestDistVersionCode() {
  const latest = lastDistVersion();
  return latest ? versionCode(latest) : null;
}

const options = parseArgs(process.argv.slice(2));
const env = readEnvFile();
const javaHome = resolveJavaHome();
const sdkDir = resolveAndroidSdk();
resolveSigning(options.debug);
writeLocalProperties(sdkDir);

let version = parseSemver(
  options.version || env.NEXT_PUBLIC_VERSION || JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version,
);
if (options.bump) version = bumpPatch(version);
const name = formatSemver(version);
const code = versionCode(version);
const previousCode = latestDistVersionCode();
if (previousCode != null && code < previousCode) {
  console.warn(
    `Warning: version ${name} (versionCode ${code}) is lower than the last APK in dist/ (versionCode ${previousCode}). Android will refuse an in-place downgrade.`,
  );
}

upsertEnv("NEXT_PUBLIC_VERSION", name);
fs.writeFileSync(
  path.join(androidDir, "app", "version.properties"),
  `versionName=${name}\nversionCode=${code}\n`,
);

const extraEnv = {
  JAVA_HOME: javaHome || process.env.JAVA_HOME || "",
  ANDROID_HOME: sdkDir,
  ANDROID_SDK_ROOT: sdkDir,
  NEXT_PUBLIC_NATIVE: "true",
  NEXT_PUBLIC_VERSION: name,
};

if (!options.skipWeb) {
  run("npx", ["next", "build"], extraEnv);
} else if (!fs.existsSync(path.join(root, "out", "index.html"))) {
  fail("--skip-web requires an existing out/ from a previous web build");
}

run("npx", ["cap", "sync", "android"], extraEnv);

const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const task = options.debug ? "assembleDebug" : "assembleRelease";
const gradleResult = spawnSync(gradle, [task], {
  cwd: androidDir,
  stdio: "inherit",
  env: { ...process.env, ...extraEnv },
  shell: process.platform === "win32",
});
if (gradleResult.status !== 0) fail(`Gradle ${task} failed`);

const builtApk = options.debug
  ? path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk")
  : path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
if (!fs.existsSync(builtApk)) {
  fail(`Gradle finished but the APK was not at ${builtApk}`);
}

fs.mkdirSync(distDir, { recursive: true });
const destName = options.debug ? `Pulseras-${name}-debug.apk` : `Pulseras-${name}.apk`;
const dest = path.join(distDir, destName);
fs.copyFileSync(builtApk, dest);
console.log(`Wrote ${path.relative(root, dest)}`);
