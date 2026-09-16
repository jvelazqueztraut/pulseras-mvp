import { describe, expect, it, vi } from "vitest";
import { createNativeBleService } from "./nativeBleService";
import type { ScanResult } from "@capacitor-community/bluetooth-le";

function makeBle() {
  let scanCallback: ((result: ScanResult) => void) | null = null;
  const ble = {
    initialize: vi.fn(async () => {}),
    isEnabled: vi.fn(async () => true),
    requestEnable: vi.fn(async () => {}),
    startEnabledNotifications: vi.fn(async () => {}),
    stopEnabledNotifications: vi.fn(async () => {}),
    requestLEScan: vi.fn(async (_options, callback: (result: ScanResult) => void) => {
      scanCallback = callback;
    }),
    stopLEScan: vi.fn(async () => {}),
    openBluetoothSettings: vi.fn(async () => {}),
    openAppSettings: vi.fn(async () => {}),
    isLocationEnabled: vi.fn(async () => true),
  };
  const advertiser = {
    isSupported: vi.fn(async () => true),
    start: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
  };
  const service = createNativeBleService({
    ble,
    advertiser,
    listenAppState: async () => async () => {},
  });
  return { ble, advertiser, service, emit: (result: ScanResult) => scanCallback?.(result) };
}

describe("native BLE service", () => {
  it("initializes and starts a single scan", async () => {
    const { ble, service } = makeBle();
    await service.initializeBluetooth();
    expect(ble.initialize).toHaveBeenCalledWith({ androidNeverForLocation: true });
    const first = await service.startScanning();
    const second = await service.startScanning();
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(ble.requestLEScan).toHaveBeenCalledTimes(1);
    await service.stopScanning();
    expect(ble.stopLEScan).toHaveBeenCalled();
    service.destroy();
  });

  it("maps permission failures without crashing", async () => {
    const { ble, service } = makeBle();
    ble.initialize.mockRejectedValueOnce(new Error("Permission denied"));
    await service.initializeBluetooth();
    const result = await service.startScanning();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("permission");
    expect(service.getSnapshot().nearbyPermission).toBe("denied");
    service.destroy();
  });

  it("deduplicates scan results by device id", async () => {
    const { service, emit } = makeBle();
    await service.startScanning();
    emit({
      device: { deviceId: "aa:bb:cc:dd:ee:ff", name: "Watch" },
      rssi: -70,
      uuids: [],
    } as ScanResult);
    emit({
      device: { deviceId: "aa:bb:cc:dd:ee:ff", name: "Watch" },
      rssi: -45,
      uuids: [],
    } as ScanResult);
    expect(service.getSnapshot().devices).toHaveLength(1);
    expect(service.getSnapshot().devices[0]?.rssi).toBe(-45);
    service.destroy();
  });

  it("reports advertising support from the advertising port", async () => {
    const { service, advertiser } = makeBle();
    await service.initializeBluetooth();
    expect(service.isAdvertisingSupported()).toBe(true);
    const started = await service.startAdvertising();
    expect(started.ok).toBe(true);
    expect(advertiser.start).toHaveBeenCalled();
    service.destroy();
  });
});
