import { App } from "@capacitor/app";
import { BleClient, type ScanResult } from "@capacitor-community/bluetooth-le";
import { buildAdvertisingOptions, mergeAdvertisingConfig } from "./advertisingConfig";
import type { AdvertisingPort } from "./advertisingPort";
import { createNativeAdvertisingPort } from "./nativeAdvertiser";
import {
  filterHiddenDevices,
  mapScanResult,
  pruneStaleDevices,
  upsertDevice,
} from "./scanMapper";
import {
  anonymousIdToBytes,
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

export interface NativeBleDeps {
  ble: Pick<
    typeof BleClient,
    | "initialize"
    | "isEnabled"
    | "requestEnable"
    | "startEnabledNotifications"
    | "stopEnabledNotifications"
    | "requestLEScan"
    | "stopLEScan"
    | "openBluetoothSettings"
    | "openAppSettings"
    | "isLocationEnabled"
  >;
  advertiser: AdvertisingPort;
  listenAppState?: (handler: (state: { isActive: boolean }) => void) => Promise<() => Promise<void>>;
}

function mapNativeError(error: unknown): Extract<ScanStartResult, { ok: false }> {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("permission") || lower.includes("denied") || lower.includes("not granted")) {
    return { ok: false, reason: "permission", message };
  }
  if (
    lower.includes("disabled") ||
    lower.includes("powered off") ||
    lower.includes("bluetooth is off") ||
    lower.includes("enable bluetooth")
  ) {
    return { ok: false, reason: "bluetooth", message };
  }
  if (lower.includes("unsupport") || lower.includes("unavailable")) {
    return { ok: false, reason: "unsupported", message };
  }
  return { ok: false, reason: "error", message };
}

export function createNativeBleService(deps?: NativeBleDeps): BleService {
  const ble = deps?.ble ?? BleClient;
  const advertiser = deps?.advertiser ?? createNativeAdvertisingPort();
  let persisted: PersistedState =
    typeof window === "undefined" ? DEFAULT_PERSISTED : loadPersisted();
  let status: BleSnapshot["status"] = "idle";
  let bluetoothEnabled = false;
  let nearbyPermission: PermissionState = "prompt";
  let locationPermission: PermissionState = "granted";
  let scanSupported = true;
  let advertisingSupported = false;
  let advertising = false;
  let lastScanAt: number | null = null;
  let startedAt: number | null = null;
  let lastError: string | null = null;
  let discovered = new Map<string, NearbyDevice>();
  let scanning = false;
  let initialized = false;
  let pruneTimer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();
  let cached = computeSnapshot();
  let removeAppListener: (() => Promise<void>) | null = null;

  function persist() {
    savePersisted(persisted);
  }

  function computeSnapshot(): BleSnapshot {
    const hidden = persisted.hidden.map((item) => ({
      id: item.id,
      hiddenAt: item.hiddenAt,
      name: item.name ?? "Unknown device",
      address: item.address ?? "—",
    }));
    return {
      status,
      mode: "native",
      bluetoothEnabled,
      nearbyPermission,
      locationPermission,
      scanSupported,
      advertisingSupported,
      advertising,
      devices: filterHiddenDevices([...discovered.values()], hidden.map((item) => item.id)),
      hidden,
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

  function clearPruneTimer() {
    if (pruneTimer) {
      clearInterval(pruneTimer);
      pruneTimer = null;
    }
  }

  async function stopNativeScan() {
    if (!scanning) {
      status = discovered.size > 0 ? "stopped" : "idle";
      startedAt = null;
      clearPruneTimer();
      emit();
      return;
    }
    scanning = false;
    clearPruneTimer();
    try {
      await ble.stopLEScan();
    } catch {
      // Already stopped.
    }
    status = discovered.size > 0 ? "stopped" : "idle";
    startedAt = null;
    lastScanAt = Date.now();
    emit();
  }

  function onScanResult(result: ScanResult) {
    if (!scanning) return;
    const mapped = mapScanResult({
      deviceId: result.device?.deviceId,
      name: result.device?.name,
      localName: result.localName,
      rssi: result.rssi,
      uuids: result.uuids,
    });
    if (!mapped) return;
    discovered = upsertDevice(discovered, mapped);
    lastScanAt = Date.now();
    emit();
  }

  async function startScanning(): Promise<ScanStartResult> {
    await initializeBluetooth();
    if (!scanSupported) {
      lastError = "BLE scanning is not supported on this device.";
      emit();
      return { ok: false, reason: "unsupported", message: lastError };
    }
    if (nearbyPermission !== "granted") {
      lastError = "Nearby devices permission denied";
      emit();
      return { ok: false, reason: "permission", message: lastError };
    }
    if (!bluetoothEnabled) {
      lastError = "Bluetooth is off";
      emit();
      return { ok: false, reason: "bluetooth", message: lastError };
    }
    if (scanning) return { ok: true };

    try {
      scanning = true;
      status = "scanning";
      startedAt = Date.now();
      lastError = null;
      emit();
      await ble.requestLEScan(
        {
          allowDuplicates: true,
          allowExtendedAdvertising: true,
        },
        onScanResult,
      );
      clearPruneTimer();
      pruneTimer = setInterval(() => {
        const maxAge = Math.max(15000, persisted.scanIntervalMs * 3);
        discovered = pruneStaleDevices(discovered, Date.now(), maxAge);
        emit();
      }, Math.max(2000, persisted.scanIntervalMs));
      return { ok: true };
    } catch (error) {
      scanning = false;
      status = discovered.size > 0 ? "stopped" : "idle";
      const mapped = mapNativeError(error);
      lastError = mapped.message ?? "Unable to start BLE scan.";
      if (mapped.reason === "permission") nearbyPermission = "denied";
      if (mapped.reason === "bluetooth") bluetoothEnabled = false;
      if (mapped.reason === "unsupported") scanSupported = false;
      emit();
      return mapped;
    }
  }

  async function initializeBluetooth(): Promise<void> {
    if (initialized) {
      try {
        bluetoothEnabled = await ble.isEnabled();
        emit();
      } catch {
        // Keep last known state.
      }
      return;
    }
    try {
      await ble.initialize({ androidNeverForLocation: true });
      initialized = true;
      scanSupported = true;
      nearbyPermission = "granted";
      bluetoothEnabled = await ble.isEnabled();
      try {
        const locationOn = await ble.isLocationEnabled();
        locationPermission = locationOn ? "granted" : "denied";
      } catch {
        locationPermission = "granted";
      }
      advertisingSupported = await advertiser.isSupported();
      lastError = null;
      await ble.startEnabledNotifications((enabled) => {
        bluetoothEnabled = enabled;
        if (!enabled) {
          if (scanning) void stopNativeScan();
          if (advertising) void stopAdvertising();
          return;
        }
        emit();
      });
      if (!removeAppListener && deps?.listenAppState) {
        removeAppListener = await deps.listenAppState((state) => {
          if (!state.isActive) {
            void stopNativeScan();
          } else {
            void initializeBluetooth();
          }
        });
      }
      emit();
    } catch (error) {
      const mapped = mapNativeError(error);
      lastError = mapped.message ?? "Bluetooth is unavailable.";
      if (mapped.reason === "permission") nearbyPermission = "denied";
      if (mapped.reason === "unsupported") scanSupported = false;
      if (mapped.reason === "bluetooth") bluetoothEnabled = false;
      initialized = mapped.reason !== "error";
      emit();
    }
  }

  async function startAdvertising(): Promise<ScanStartResult> {
    await initializeBluetooth();
    if (!advertisingSupported) {
      lastError = "BLE advertising is not supported on this device.";
      emit();
      return { ok: false, reason: "unsupported", message: lastError };
    }
    if (!bluetoothEnabled) {
      lastError = "Bluetooth is off";
      emit();
      return { ok: false, reason: "bluetooth", message: lastError };
    }
    try {
      await advertiser.start(
        buildAdvertisingOptions(persisted.advertising, anonymousIdToBytes(persisted.anonymousId)),
      );
      advertising = true;
      lastError = null;
      emit();
      return { ok: true };
    } catch (error) {
      const mapped = mapNativeError(error);
      lastError = mapped.message ?? "Unable to start BLE advertising.";
      advertising = false;
      emit();
      return mapped;
    }
  }

  async function stopAdvertising(): Promise<void> {
    try {
      await advertiser.stop();
    } catch {
      // Ignore.
    }
    advertising = false;
    emit();
  }

  if (!deps && typeof window !== "undefined") {
    void App.addListener("appStateChange", (state) => {
      if (!state.isActive) {
        void stopNativeScan();
      } else {
        void initializeBluetooth();
      }
    }).then((handle) => {
      removeAppListener = async () => {
        await handle.remove();
      };
    });
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
    initializeBluetooth,
    async isBluetoothEnabled() {
      try {
        bluetoothEnabled = await ble.isEnabled();
        emit();
        return bluetoothEnabled;
      } catch {
        return bluetoothEnabled;
      }
    },
    async requestBluetoothPermissions() {
      initialized = false;
      await initializeBluetooth();
      return nearbyPermission;
    },
    startScan: startScanning,
    stopScan: stopNativeScan,
    startScanning,
    stopScanning: stopNativeScan,
    hideDevice(id) {
      const device = discovered.get(id);
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
      return device ? { ...device } : undefined;
    },
    restoreDevice(id) {
      persisted = {
        ...persisted,
        hidden: persisted.hidden.filter((item) => item.id !== id),
      };
      persist();
      emit();
    },
    restoreAll() {
      persisted = { ...persisted, hidden: [] };
      persist();
      emit();
    },
    setBluetoothEnabled(enabled) {
      if (enabled) {
        void ble.requestEnable().then(
          () => initializeBluetooth(),
          () => ble.openBluetoothSettings(),
        );
        return;
      }
      void ble.openBluetoothSettings();
    },
    setNearbyPermission(state) {
      if (state === "granted") {
        initialized = false;
        void initializeBluetooth();
        return;
      }
      void ble.openAppSettings();
    },
    setLocationPermission() {
      void ble.openAppSettings();
    },
    setScanInterval(ms) {
      persisted = { ...persisted, scanIntervalMs: ms };
      persist();
      emit();
    },
    resetDemo() {
      persisted = { ...DEFAULT_PERSISTED, anonymousId: persisted.anonymousId };
      persist();
      discovered = new Map();
      status = "idle";
      lastError = null;
      emit();
    },
    getDevice(id) {
      if (persisted.hidden.some((item) => item.id === id)) return undefined;
      const live = discovered.get(id);
      return live ? { ...live } : undefined;
    },
    getHiddenDevice(id) {
      const hidden = persisted.hidden.find((item) => item.id === id);
      if (!hidden) return undefined;
      return {
        id,
        name: hidden.name ?? "Unknown device",
        address: hidden.address ?? "—",
        rssi: null,
        lastSeenAt: hidden.hiddenAt,
        protocol: "BLE",
      };
    },
    async openBluetoothSettings() {
      await ble.openBluetoothSettings();
    },
    async openAppSettings() {
      await ble.openAppSettings();
    },
    startAdvertising,
    stopAdvertising,
    isAdvertisingSupported() {
      return advertisingSupported;
    },
    setAdvertisingConfig(config) {
      persisted = {
        ...persisted,
        advertising: mergeAdvertisingConfig(persisted.advertising, config),
      };
      persist();
      emit();
      if (advertising) {
        void startAdvertising();
      }
    },
    destroy() {
      void stopNativeScan();
      void stopAdvertising();
      void ble.stopEnabledNotifications();
      void removeAppListener?.();
      listeners.clear();
      clearPruneTimer();
    },
  };
}
