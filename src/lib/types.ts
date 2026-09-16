export type ScanStatus = "idle" | "scanning" | "stopped";
export type PermissionState = "granted" | "denied" | "prompt";
export type Proximity = "Very close" | "Close" | "Nearby" | "Far" | "Unknown";

export interface NearbyDevice {
  id: string;
  name: string;
  address: string;
  rssi: number | null;
  lastSeenAt: number | null;
  protocol: "BLE";
}

export interface HiddenDevice {
  id: string;
  hiddenAt: number;
}

export interface BleSnapshot {
  status: ScanStatus;
  bluetoothEnabled: boolean;
  nearbyPermission: PermissionState;
  locationPermission: PermissionState;
  devices: NearbyDevice[];
  hidden: HiddenDevice[];
  lastScanAt: number | null;
  scanIntervalMs: number;
  startedAt: number | null;
}

export interface BleService {
  subscribe(listener: () => void): () => void;
  getSnapshot(): BleSnapshot;
  getServerSnapshot(): BleSnapshot;
  startScan(): { ok: true } | { ok: false; reason: "bluetooth" | "permission" };
  stopScan(): void;
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
}
