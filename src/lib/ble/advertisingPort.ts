export interface AdvertisingOptions {
  serviceUuid: string;
  localName: string;
  includeServiceUuid: boolean;
  includeLocalName: boolean;
  includeTxPower: boolean;
  includeManufacturerData: boolean;
  connectable: boolean;
  mode: "lowPower" | "balanced" | "lowLatency";
  txPower: "ultraLow" | "low" | "medium" | "high";
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
