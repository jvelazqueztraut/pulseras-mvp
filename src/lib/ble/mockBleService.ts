import { BASE_RSSI, DEVICE_CATALOG } from "../mock-catalog";
import { mergeAdvertisingConfig } from "./advertisingConfig";
import {
  DEFAULT_PERSISTED,
  loadPersisted,
  savePersisted,
  type PersistedState,
} from "../storage";
import {
  DEFAULT_SNAPSHOT,
  type BleService,
  type BleSnapshot,
  type NearbyDevice,
  type PermissionState,
  type ScanStartResult,
} from "../types";

function jitter(base: number): number {
  const delta = Math.round((Math.random() - 0.5) * 10);
  return Math.max(-100, Math.min(-30, base + delta));
}

function cloneDevice(device: NearbyDevice): NearbyDevice {
  return { ...device };
}

export function createMockBleService(): BleService {
  let persisted: PersistedState =
    typeof window === "undefined" ? DEFAULT_PERSISTED : loadPersisted();
  let status: BleSnapshot["status"] = "idle";
  let lastScanAt: number | null = null;
  let startedAt: number | null = null;
  let lastError: string | null = null;
  let discovered = new Map<string, NearbyDevice>();
  let tick = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();
  let cached = computeSnapshot();

  function persist() {
    savePersisted(persisted);
  }

  function visibleDevices(): NearbyDevice[] {
    const hidden = new Set(persisted.hidden.map((item) => item.id));
    return [...discovered.values()]
      .filter((device) => !hidden.has(device.id))
      .map(cloneDevice);
  }

  function computeSnapshot(): BleSnapshot {
    return {
      status,
      mode: "mock",
      bluetoothEnabled: persisted.bluetoothEnabled,
      nearbyPermission: persisted.nearbyPermission,
      locationPermission: persisted.locationPermission,
      scanSupported: true,
      advertisingSupported: false,
      advertising: false,
      devices: visibleDevices(),
      hidden: persisted.hidden.map((item) => ({
        id: item.id,
        hiddenAt: item.hiddenAt,
        name: item.name ?? "Unknown device",
        address: item.address ?? "—",
      })),
      lastScanAt,
      scanIntervalMs: persisted.scanIntervalMs,
      startedAt,
      lastError,
      advertisingConfig: persisted.advertising,
    };
  }

  function emit() {
    cached = computeSnapshot();
    listeners.forEach((listener) => listener());
  }

  function catalogDevice(id: string, now: number): NearbyDevice | undefined {
    const meta = DEVICE_CATALOG.find((item) => item.id === id);
    if (!meta) return undefined;
    return {
      ...meta,
      rssi: jitter(BASE_RSSI[id] ?? -70),
      lastSeenAt: now,
    };
  }

  function discoverNext(now: number) {
    const hidden = new Set(persisted.hidden.map((item) => item.id));
    const next = DEVICE_CATALOG.slice(0, 6).find(
      (item) => !discovered.has(item.id) && !hidden.has(item.id),
    );
    if (!next) return;
    const device = catalogDevice(next.id, now);
    if (device) discovered.set(device.id, device);
  }

  function updateExisting(now: number) {
    const hidden = new Set(persisted.hidden.map((item) => item.id));
    for (const [id, device] of discovered) {
      if (hidden.has(id)) continue;
      if (Math.random() < 0.04 && discovered.size > 4 && tick > 8) {
        discovered.delete(id);
        continue;
      }
      discovered.set(id, {
        ...device,
        rssi: jitter(BASE_RSSI[id] ?? device.rssi ?? -70),
        lastSeenAt: now,
      });
    }
  }

  function runTick() {
    if (status !== "scanning") return;
    tick += 1;
    const now = Date.now();
    lastScanAt = now;
    updateExisting(now);
    if (tick === 1 || tick % 2 === 0) {
      discoverNext(now);
    }
    emit();
  }

  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function armTimer() {
    clearTimer();
    const interval = Math.max(1500, persisted.scanIntervalMs);
    timer = setInterval(runTick, interval);
  }

  function canScan(): ScanStartResult {
    if (!persisted.bluetoothEnabled) {
      lastError = "Bluetooth is off";
      return { ok: false, reason: "bluetooth", message: lastError };
    }
    if (persisted.nearbyPermission !== "granted" || persisted.locationPermission !== "granted") {
      lastError = "Nearby devices permission denied";
      return { ok: false, reason: "permission", message: lastError };
    }
    lastError = null;
    return { ok: true };
  }

  async function startScanning(): Promise<ScanStartResult> {
    const allowed = canScan();
    if (!allowed.ok) {
      status = "idle";
      emit();
      return allowed;
    }
    const now = Date.now();
    status = "scanning";
    startedAt = now;
    lastScanAt = now;
    tick = 0;
    if (discovered.size === 0) {
      discoverNext(now);
    } else {
      updateExisting(now);
    }
    setTimeout(() => {
      if (status === "scanning") {
        discoverNext(Date.now());
        emit();
      }
    }, 900);
    setTimeout(() => {
      if (status === "scanning") {
        discoverNext(Date.now());
        emit();
      }
    }, 1800);
    armTimer();
    emit();
    return { ok: true };
  }

  async function stopScanning(): Promise<void> {
    status = discovered.size > 0 ? "stopped" : "idle";
    startedAt = null;
    lastScanAt = Date.now();
    clearTimer();
    emit();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return cached;
    },
    getServerSnapshot() {
      return DEFAULT_SNAPSHOT;
    },
    async initializeBluetooth() {},
    async isBluetoothEnabled() {
      return persisted.bluetoothEnabled;
    },
    async requestBluetoothPermissions() {
      persisted = {
        ...persisted,
        nearbyPermission: "granted",
        locationPermission: "granted",
      };
      persist();
      emit();
      return "granted";
    },
    startScan: startScanning,
    stopScan: stopScanning,
    startScanning,
    stopScanning,
    hideDevice(id) {
      const device = discovered.get(id) ?? catalogDevice(id, Date.now());
      if (!persisted.hidden.some((item) => item.id === id)) {
        persisted = {
          ...persisted,
          hidden: [
            ...persisted.hidden,
            {
              id,
              hiddenAt: Date.now(),
              name: device?.name ?? "Unknown device",
              address: device?.address ?? "—",
            },
          ],
        };
        persist();
      }
      discovered.delete(id);
      emit();
      return device ? cloneDevice(device) : undefined;
    },
    restoreDevice(id) {
      persisted = {
        ...persisted,
        hidden: persisted.hidden.filter((item) => item.id !== id),
      };
      persist();
      if (status !== "idle") {
        const restored = catalogDevice(id, Date.now());
        if (restored) discovered.set(id, restored);
      }
      emit();
    },
    restoreAll() {
      const ids = persisted.hidden.map((item) => item.id);
      persisted = { ...persisted, hidden: [] };
      persist();
      if (status !== "idle") {
        const now = Date.now();
        ids.forEach((id) => {
          const restored = catalogDevice(id, now);
          if (restored) discovered.set(id, restored);
        });
      }
      emit();
    },
    setBluetoothEnabled(enabled) {
      persisted = { ...persisted, bluetoothEnabled: enabled };
      persist();
      if (!enabled && status === "scanning") {
        void stopScanning();
        return;
      }
      emit();
    },
    setNearbyPermission(state: PermissionState) {
      persisted = { ...persisted, nearbyPermission: state };
      persist();
      if (state !== "granted" && status === "scanning") {
        void stopScanning();
        return;
      }
      emit();
    },
    setLocationPermission(state: PermissionState) {
      persisted = { ...persisted, locationPermission: state };
      persist();
      if (state !== "granted" && status === "scanning") {
        void stopScanning();
        return;
      }
      emit();
    },
    setScanInterval(ms) {
      persisted = { ...persisted, scanIntervalMs: ms };
      persist();
      if (status === "scanning") armTimer();
      emit();
    },
    resetDemo() {
      persisted = { ...DEFAULT_PERSISTED, anonymousId: persisted.anonymousId };
      persist();
      status = "idle";
      lastScanAt = null;
      startedAt = null;
      lastError = null;
      tick = 0;
      discovered = new Map();
      clearTimer();
      emit();
    },
    getDevice(id) {
      const hidden = new Set(persisted.hidden.map((item) => item.id));
      if (hidden.has(id)) return undefined;
      const live = discovered.get(id);
      if (live) return cloneDevice(live);
      return undefined;
    },
    getHiddenDevice(id) {
      const hidden = persisted.hidden.find((item) => item.id === id);
      const meta = DEVICE_CATALOG.find((item) => item.id === id);
      if (!hidden && !meta) return undefined;
      return {
        id,
        name: hidden?.name ?? meta?.name ?? "Unknown device",
        address: hidden?.address ?? meta?.address ?? "—",
        rssi: BASE_RSSI[id] ?? null,
        lastSeenAt: hidden?.hiddenAt ?? null,
        protocol: "BLE",
      };
    },
    async openBluetoothSettings() {},
    async openAppSettings() {},
    async startAdvertising() {
      lastError =
        "BLE advertising only works in the Android app. The browser cannot transmit BLE advertisements.";
      emit();
      return { ok: false, reason: "unsupported", message: lastError };
    },
    async stopAdvertising() {},
    isAdvertisingSupported() {
      return false;
    },
    setAdvertisingConfig(config) {
      persisted = {
        ...persisted,
        advertising: mergeAdvertisingConfig(persisted.advertising, config),
      };
      persist();
      emit();
    },
    destroy() {
      clearTimer();
      listeners.clear();
    },
  };
}

let singleton: BleService | null = null;

export function getMockBleService(): BleService {
  if (!singleton) singleton = createMockBleService();
  return singleton;
}

export function resetMockBleService(): void {
  singleton?.destroy();
  singleton = null;
}
