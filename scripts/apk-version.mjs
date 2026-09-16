export function parseSemver(input) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(input).trim());
  if (!match) {
    throw new Error(`Expected version X.Y.Z, got "${input}"`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

export function versionCode({ major, minor, patch }) {
  if (minor > 99 || patch > 99) {
    throw new Error("minor and patch must be 0–99 for the Android versionCode scheme");
  }
  return major * 10000 + minor * 100 + patch;
}

export function bumpPatch(version) {
  const next = { ...version, patch: version.patch + 1 };
  if (next.patch > 99) {
    next.patch = 0;
    next.minor += 1;
  }
  if (next.minor > 99) {
    next.minor = 0;
    next.major += 1;
  }
  return next;
}

export function compareSemver(a, b) {
  return versionCode(a) - versionCode(b);
}

export function parseApkFileVersion(filename) {
  const match = /Pulseras-(\d+\.\d+\.\d+)(?:-debug)?\.apk$/i.exec(filename);
  return match ? parseSemver(match[1]) : null;
}
