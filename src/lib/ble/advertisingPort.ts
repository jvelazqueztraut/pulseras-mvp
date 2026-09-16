export interface AdvertisingOptions {
  serviceUuid: string;
  localName: string;
  manufacturerId: number;
  manufacturerData: number[];
}

export interface AdvertisingPort {
  isSupported(): Promise<boolean>;
  start(options: AdvertisingOptions): Promise<void>;
  stop(): Promise<void>;
}

export const unsupportedAdvertising: AdvertisingPort = {
  async isSupported() {
    return false;
  },
  async start() {
    throw new Error("BLE advertising is not supported on this platform.");
  },
  async stop() {},
};
