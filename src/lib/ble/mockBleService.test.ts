import { afterEach, describe, expect, it } from "vitest";
import { createMockBleService } from "./mockBleService";

describe("mock BLE service", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("starts and stops a simulated scan", async () => {
    const ble = createMockBleService();
    await ble.initializeBluetooth();
    const started = await ble.startScanning();
    expect(started.ok).toBe(true);
    expect(ble.getSnapshot().status).toBe("scanning");
    await ble.stopScanning();
    expect(["stopped", "idle"]).toContain(ble.getSnapshot().status);
    ble.destroy();
  });

  it("blocks scanning when permission is denied", async () => {
    const ble = createMockBleService();
    ble.setNearbyPermission("denied");
    const result = await ble.startScanning();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("permission");
    ble.destroy();
  });

  it("blocks scanning when Bluetooth is off", async () => {
    const ble = createMockBleService();
    ble.setBluetoothEnabled(false);
    const result = await ble.startScanning();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("bluetooth");
    ble.destroy();
  });

  it("hides devices across subsequent scans", async () => {
    const ble = createMockBleService();
    await ble.startScanning();
    const first = ble.getSnapshot().devices[0];
    expect(first).toBeTruthy();
    ble.hideDevice(first.id);
    expect(ble.getSnapshot().devices.find((item) => item.id === first.id)).toBeUndefined();
    await ble.stopScanning();
    await ble.startScanning();
    expect(ble.getSnapshot().devices.find((item) => item.id === first.id)).toBeUndefined();
    ble.destroy();
  });

  it("does not claim advertising support in mock mode", async () => {
    const ble = createMockBleService();
    expect(ble.isAdvertisingSupported()).toBe(false);
    const result = await ble.startAdvertising();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/android app/i);
    }
    ble.destroy();
  });

  it("stores advertising configuration in mock mode", () => {
    const ble = createMockBleService();
    ble.setAdvertisingConfig({ localName: "Pulse", descriptor: "lab" });
    expect(ble.getSnapshot().advertisingConfig.localName).toBe("Pulse");
    expect(ble.getSnapshot().advertisingConfig.descriptor).toBe("lab");
    ble.destroy();
  });
});
