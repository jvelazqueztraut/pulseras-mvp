import { registerPlugin } from "@capacitor/core";
import type { AdvertisingOptions, AdvertisingPort } from "./advertisingPort";
import { unsupportedAdvertising } from "./advertisingPort";

interface NativeAdvertiserPlugin {
  isSupported(): Promise<{ supported: boolean }>;
  start(options: {
    serviceUuid: string;
    localName: string;
    manufacturerId: number;
    manufacturerData: number[];
  }): Promise<void>;
  stop(): Promise<void>;
}

const NativeAdvertiser = registerPlugin<NativeAdvertiserPlugin>("PulserasAdvertiser", {
  web: () =>
    Promise.resolve({
      isSupported: async () => ({ supported: false }),
      start: async () => {
        throw new Error("BLE advertising is not supported in the browser.");
      },
      stop: async () => {},
    }),
});

export function createNativeAdvertisingPort(): AdvertisingPort {
  return {
    async isSupported() {
      try {
        const result = await NativeAdvertiser.isSupported();
        return result.supported === true;
      } catch {
        return false;
      }
    },
    async start(options: AdvertisingOptions) {
      await NativeAdvertiser.start(options);
    },
    async stop() {
      await NativeAdvertiser.stop();
    },
  };
}

export { unsupportedAdvertising };
