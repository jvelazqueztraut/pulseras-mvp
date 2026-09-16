import { BASE_RSSI, DEVICE_CATALOG } from "../mock-catalog";
import {
  DEFAULT_PERSISTED,
  loadPersisted,
  savePersisted,
  type PersistedState,
} from "../storage";
import type { BleService, BleSnapshot, NearbyDevice, PermissionState } from "../types";

const DEFAULT_SNAPSHOT: BleSnapshot = {
  status: "idle",
  bluetoothEnabled: true,
  nearbyPermission: "granted",
  locationPermission: "granted",
  devices: [],
  hidden: [],
  lastScanAt: null,
  scanIntervalMs: 5000,
  startedAt: null,
};

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
  let discovered = new Map<string, NearbyDevice>();
  let tick = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  function persist() {
    savePersisted(persisted);
  }

  function visibleDevices(): NearbyDevice[] {
    const hidden = new Set(persisted.hidden.map((item) => item.id));
    return [...discovered.values()]
      .filter((device) => !hidden.has(device.id))
      .map(cloneDevice);
  }

  function snapshot(): BleSnapshot {
    return {
      status,
      bluetoothEnabled: persisted.bluetoothEnabled,
      nearbyPermission: persisted.nearbyPermission,
      locationPermission: persisted.locationPermission,
      devices: visibleDevices(),
      hidden: persisted.hidden.map((item) => ({ ...item })),
      lastScanAt,
      scanIntervalMs: persisted.scanIntervalMs,
      startedAt,
    };
  }

  function emit() {
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

  function canScan(): { ok: true } | { ok: false; reason: "bluetooth" | "permission" } {
    if (!persisted.bluetoothEnabled) return { ok: false, reason: "bluetooth" };
    if (persisted.nearbyPermission !== "granted" || persisted.locationPermission !== "granted") {
      return { ok: false, reason: "permission" };
    }
    return { ok: true };
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: snapshot,
    getServerSnapshot() {
      return DEFAULT_SNAPSHOT;
    },
    startScan() {
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
    },
    stopScan() {
      status = discovered.size > 0 ? "stopped" : "idle";
      startedAt = null;
      lastScanAt = Date.now();
      clearTimer();
      emit();
    },
    hideDevice(id) {
      const device = discovered.get(id) ?? catalogDevice(id, Date.now());
      if (!persisted.hidden.some((item) => item.id === id)) {
        persisted = {
          ...persisted,
          hidden: [...persisted.hidden, { id, hiddenAt: Date.now() }],
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
        status = discovered.size > 0 ? "stopped" : "idle";
        startedAt = null;
        clearTimer();
      }
      emit();
    },
    setNearbyPermission(state: PermissionState) {
      persisted = { ...persisted, nearbyPermission: state };
      persist();
      if (state !== "granted" && status === "scanning") {
        status = discovered.size > 0 ? "stopped" : "idle";
        startedAt = null;
        clearTimer();
      }
      emit();
    },
    setLocationPermission(state: PermissionState) {
      persisted = { ...persisted, locationPermission: state };
      persist();
      if (state !== "granted" && status === "scanning") {
        status = discovered.size > 0 ? "stopped" : "idle";
        startedAt = null;
        clearTimer();
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
      persisted = { ...DEFAULT_PERSISTED };
      persist();
      status = "idle";
      lastScanAt = null;
      startedAt = null;
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
      const meta = DEVICE_CATALOG.find((item) => item.id === id);
      if (!meta) return undefined;
      return {
        ...meta,
        rssi: BASE_RSSI[id] ?? null,
        lastSeenAt: persisted.hidden.find((item) => item.id === id)?.hiddenAt ?? null,
      };
    },
  };
}

let singleton: BleService | null = null;

export function getMockBleService(): BleService {
  if (!singleton) singleton = createMockBleService();
  return singleton;
}
