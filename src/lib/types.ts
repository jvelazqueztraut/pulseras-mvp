export type ScanStatus = "idle" | "scanning" | "stopped";
export type PermissionState = "granted" | "denied" | "prompt";
export type Proximity = "Very close" | "Close" | "Nearby" | "Far" | "Unknown";
export type BleMode = "mock" | "native";
export type BleBlockReason = "bluetooth" | "permission" | "unsupported" | "error";

export interface NearbyDevice {
  id: string;
  name: string;
  address: string;
  rssi: number | null;
  lastSeenAt: number | null;
  protocol: "BLE";
  pulserasPeer?: boolean;
}

export interface HiddenDevice {
  id: string;
  hiddenAt: number;
  name: string;
  address: string;
}

export interface BleSnapshot {
  status: ScanStatus;
  mode: BleMode;
  bluetoothEnabled: boolean;
  nearbyPermission: PermissionState;
  locationPermission: PermissionState;
  scanSupported: boolean;
  advertisingSupported: boolean;
  advertising: boolean;
  devices: NearbyDevice[];
  hidden: HiddenDevice[];
  lastScanAt: number | null;
  scanIntervalMs: number;
  startedAt: number | null;
  lastError: string | null;
}

export type ScanStartResult =
  | { ok: true }
  | { ok: false; reason: BleBlockReason; message?: string };

export interface BleService {
  subscribe(listener: () => void): () => void;
  getSnapshot(): BleSnapshot;
  getServerSnapshot(): BleSnapshot;
  initializeBluetooth(): Promise<void>;
  isBluetoothEnabled(): Promise<boolean>;
  requestBluetoothPermissions(): Promise<PermissionState>;
  startScan(): Promise<ScanStartResult>;
  stopScan(): Promise<void>;
  startScanning(): Promise<ScanStartResult>;
  stopScanning(): Promise<void>;
  hideDevice(id: string): NearbyDevice | undefined;
  restoreDevice(id: string): void;
  restoreAll(): void;
  setBluetoothEnabled(enabled: boolean): void;
  setNearbyPermission(state: PermissionState): void;
  setLocationPermission(state: PermissionState): void;
  setScanInterval(ms: number): void;
  resetDemo(): void;
  getDevice(id: string): NearbyDevice | undefined;
  getHiddenDevice(id: string): NearbyDevice | undefined;
  openBluetoothSettings(): Promise<void>;
  openAppSettings(): Promise<void>;
  startAdvertising(): Promise<ScanStartResult>;
  stopAdvertising(): Promise<void>;
  isAdvertisingSupported(): boolean;
  destroy(): void;
}

export const DEFAULT_SNAPSHOT: BleSnapshot = {
  status: "idle",
  mode: "mock",
  bluetoothEnabled: true,
  nearbyPermission: "granted",
  locationPermission: "granted",
  scanSupported: true,
  advertisingSupported: false,
  advertising: false,
  devices: [],
  hidden: [],
  lastScanAt: null,
  scanIntervalMs: 5000,
  startedAt: null,
  lastError: null,
};
