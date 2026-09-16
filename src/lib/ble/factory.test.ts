import { describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => "web",
  },
  registerPlugin: () => ({
    isSupported: async () => ({ supported: false }),
    start: async () => {},
    stop: async () => {},
  }),
}));

import { createBleService, isNativeAndroid } from "./factory";

describe("web fallback factory", () => {
  it("uses mock BLE outside Capacitor Android", () => {
    expect(isNativeAndroid()).toBe(false);
    const ble = createBleService();
    expect(ble.getSnapshot().mode).toBe("mock");
    ble.destroy();
  });
});
