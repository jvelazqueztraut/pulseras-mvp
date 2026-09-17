import { describe, expect, it } from "vitest";
import { proximityFromRssi, RSSI_THRESHOLDS } from "../proximity";
import {
  anonymousLabel,
  displayDeviceName,
  filterHiddenDevices,
  mapScanResult,
  pruneStaleDevices,
  upsertDevice,
} from "./scanMapper";
import { isPulserasServiceUuid, PULSERAS_SERVICE_UUID } from "./protocol";
import { DEFAULT_ADVERTISING_CONFIG, buildAdvertisingOptions } from "./advertisingConfig";
import { unsupportedAdvertising } from "./advertisingPort";
import type { NearbyDevice } from "../types";

function device(partial: Partial<NearbyDevice> & { id: string }): NearbyDevice {
  return {
    name: "Unknown device",
    address: "00:00:00:00",
    rssi: null,
    lastSeenAt: Date.now(),
    protocol: "BLE",
    ...partial,
  };
}

describe("RSSI proximity mapping", () => {
  it("maps qualitative bands from centralized thresholds", () => {
    expect(proximityFromRssi(null)).toBe("Unknown");
    expect(proximityFromRssi(RSSI_THRESHOLDS.veryClose)).toBe("Very close");
    expect(proximityFromRssi(RSSI_THRESHOLDS.close)).toBe("Close");
    expect(proximityFromRssi(RSSI_THRESHOLDS.nearby)).toBe("Nearby");
    expect(proximityFromRssi(RSSI_THRESHOLDS.far)).toBe("Far");
    expect(proximityFromRssi(RSSI_THRESHOLDS.far - 1)).toBe("Unknown");
  });
});

describe("scan mapping and identity", () => {
  it("uses advertised names and otherwise an anonymous label", () => {
    expect(displayDeviceName("Pixel 8", "ignored")).toBe("Pixel 8");
    expect(displayDeviceName("", "")).toBe("Unknown device");
    expect(anonymousLabel("aa:bb:cc:dd:ee:ff")).toBe("CC:DD:EE:FF");
  });

  it("deduplicates devices by id and keeps the latest RSSI", () => {
    const first = mapScanResult({ deviceId: "aa:bb", name: "One", rssi: -80 })!;
    const second = mapScanResult({ deviceId: "aa:bb", name: "One", rssi: -40 })!;
    const merged = upsertDevice(upsertDevice(new Map(), first), second);
    expect(merged.size).toBe(1);
    expect(merged.get("aa:bb")?.rssi).toBe(-40);
  });

  it("filters hidden devices from scan results", () => {
    const visible = filterHiddenDevices(
      [device({ id: "keep" }), device({ id: "hide-me" })],
      ["hide-me"],
    );
    expect(visible.map((item) => item.id)).toEqual(["keep"]);
  });

  it("recognizes the Pulseras service UUID", () => {
    expect(isPulserasServiceUuid(PULSERAS_SERVICE_UUID)).toBe(true);
    const mapped = mapScanResult({
      deviceId: "id-1",
      name: "Pulseras",
      uuids: [PULSERAS_SERVICE_UUID],
    });
    expect(mapped?.pulserasPeer).toBe(true);
  });

  it("prunes stale advertisements", () => {
    const now = 10_000;
    const map = new Map<string, NearbyDevice>([
      ["fresh", device({ id: "fresh", lastSeenAt: now - 1000 })],
      ["old", device({ id: "old", lastSeenAt: now - 20_000 })],
    ]);
    const pruned = pruneStaleDevices(map, now, 5000);
    expect([...pruned.keys()]).toEqual(["fresh"]);
  });
});

describe("advertising capability", () => {
  it("reports unsupported advertising on the web fallback", async () => {
    expect(await unsupportedAdvertising.isSupported()).toBe(false);
    await expect(
      unsupportedAdvertising.start(buildAdvertisingOptions(DEFAULT_ADVERTISING_CONFIG, [1])),
    ).rejects.toThrow(/not supported/i);
  });
});
