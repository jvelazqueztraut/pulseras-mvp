import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.pulseras.mvp",
  appName: "Pulseras",
  webDir: "out",
  backgroundColor: "#080c16",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Scanning...",
        cancel: "Cancel",
        availableDevices: "Available devices",
        noDeviceFound: "No device found",
      },
    },
  },
};

export default config;
