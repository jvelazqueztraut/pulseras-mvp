"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getBleService } from "@/lib/ble/factory";
import type { BleBlockReason, BleService, BleSnapshot, NearbyDevice } from "@/lib/types";

export type HomeBlocker = BleBlockReason | null;

interface PulserasContextValue {
  ble: BleService;
  snapshot: BleSnapshot;
  blocker: HomeBlocker;
  recentlyHidden: NearbyDevice | null;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  dismissBlocker: () => void;
  hideDevice: (id: string) => NearbyDevice | undefined;
  undoHide: () => void;
  clearHiddenToast: () => void;
}

const PulserasContext = createContext<PulserasContextValue | null>(null);

export function PulserasProvider({ children }: { children: ReactNode }) {
  const ble = getBleService();
  const snapshot = useSyncExternalStore(
    ble.subscribe,
    ble.getSnapshot,
    ble.getServerSnapshot,
  );
  const [dismissed, setDismissed] = useState<HomeBlocker>(null);
  const [recentlyHidden, setRecentlyHidden] = useState<NearbyDevice | null>(null);

  useEffect(() => {
    void ble.initializeBluetooth();
  }, [ble]);

  const permissionBlocked =
    snapshot.nearbyPermission !== "granted" ||
    (snapshot.mode === "mock" && snapshot.locationPermission !== "granted");

  let blocker: HomeBlocker = null;
  if (!snapshot.scanSupported && snapshot.mode === "native") {
    blocker = dismissed === "unsupported" ? null : "unsupported";
  } else if (!snapshot.bluetoothEnabled) {
    blocker = dismissed === "bluetooth" ? null : "bluetooth";
  } else if (permissionBlocked) {
    blocker = dismissed === "permission" ? null : "permission";
  }

  const startScan = useCallback(async () => {
    const result = await ble.startScanning();
    if (!result.ok) {
      setDismissed(null);
    }
  }, [ble]);

  const stopScan = useCallback(async () => {
    await ble.stopScanning();
  }, [ble]);

  const dismissBlocker = useCallback(() => {
    if (!snapshot.scanSupported && snapshot.mode === "native") setDismissed("unsupported");
    else if (!snapshot.bluetoothEnabled) setDismissed("bluetooth");
    else setDismissed("permission");
  }, [snapshot.bluetoothEnabled, snapshot.mode, snapshot.scanSupported]);

  const hideDevice = useCallback(
    (id: string) => {
      const device = ble.hideDevice(id);
      if (device) setRecentlyHidden(device);
      return device;
    },
    [ble],
  );

  const undoHide = useCallback(() => {
    if (!recentlyHidden) return;
    ble.restoreDevice(recentlyHidden.id);
    setRecentlyHidden(null);
  }, [ble, recentlyHidden]);

  const clearHiddenToast = useCallback(() => {
    setRecentlyHidden(null);
  }, []);

  const value = useMemo(
    () => ({
      ble,
      snapshot,
      blocker,
      recentlyHidden,
      startScan,
      stopScan,
      dismissBlocker,
      hideDevice,
      undoHide,
      clearHiddenToast,
    }),
    [
      ble,
      snapshot,
      blocker,
      recentlyHidden,
      startScan,
      stopScan,
      dismissBlocker,
      hideDevice,
      undoHide,
      clearHiddenToast,
    ],
  );

  return <PulserasContext.Provider value={value}>{children}</PulserasContext.Provider>;
}

export function usePulseras() {
  const context = useContext(PulserasContext);
  if (!context) {
    throw new Error("usePulseras must be used within PulserasProvider");
  }
  return context;
}
