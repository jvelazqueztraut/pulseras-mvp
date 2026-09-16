import { vi } from "vitest";

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

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: async () => ({ remove: async () => {} }),
  },
}));

vi.mock("@capacitor-community/bluetooth-le", () => ({
  BleClient: {},
}));
