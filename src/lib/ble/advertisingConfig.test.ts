import { describe, expect, it } from "vitest";
import {
  DEFAULT_ADVERTISING_CONFIG,
  buildAdvertisingOptions,
  mergeAdvertisingConfig,
  sanitizeDescriptor,
  sanitizeLocalName,
} from "./advertisingConfig";

describe("advertising config", () => {
  it("keeps a compact default payload (UUID, no manufacturer data)", () => {
    const options = buildAdvertisingOptions(DEFAULT_ADVERTISING_CONFIG, [1, 2, 3, 4, 5, 6, 7, 8]);
    expect(options.includeServiceUuid).toBe(true);
    expect(options.includeManufacturerData).toBe(false);
    expect(options.includeLocalName).toBe(false);
    expect(options.connectable).toBe(false);
  });

  it("appends a sanitized descriptor to manufacturer data", () => {
    const config = mergeAdvertisingConfig(DEFAULT_ADVERTISING_CONFIG, {
      includeManufacturerData: true,
      descriptor: "  hello🎉world  ",
    });
    expect(config.descriptor).toBe("hellowor");
    const options = buildAdvertisingOptions(config, [9, 8, 7, 6, 5, 4, 3, 2]);
    expect(options.manufacturerData.slice(-8)).toEqual(
      [...sanitizeDescriptor("hellowor")].map((ch) => ch.charCodeAt(0)),
    );
  });

  it("falls back to Pulseras for an empty local name", () => {
    expect(sanitizeLocalName("   ")).toBe("Pulseras");
  });
});
