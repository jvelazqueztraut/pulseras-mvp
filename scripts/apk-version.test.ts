import { describe, expect, it } from "vitest";
import {
  bumpPatch,
  parseApkFileVersion,
  parseSemver,
  versionCode,
} from "./apk-version.mjs";

describe("APK versioning", () => {
  it("flattens semver to Android versionCode", () => {
    expect(versionCode(parseSemver("0.1.0"))).toBe(100);
    expect(versionCode(parseSemver("1.2.3"))).toBe(10203);
  });

  it("bumps patch and parses dist filenames", () => {
    expect(bumpPatch(parseSemver("0.1.0"))).toEqual({ major: 0, minor: 1, patch: 1 });
    expect(parseApkFileVersion("Pulseras-0.1.2.apk")).toEqual({
      major: 0,
      minor: 1,
      patch: 2,
    });
    expect(parseApkFileVersion("Pulseras-0.1.2-debug.apk")?.patch).toBe(2);
  });
});
