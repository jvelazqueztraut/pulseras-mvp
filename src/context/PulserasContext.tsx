"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getMockBleService } from "@/lib/ble/mockBleService";
import type { BleService, BleSnapshot, NearbyDevice } from "@/lib/types";

export type HomeBlocker = "bluetooth" | "permission" | null;

interface PulserasContextValue {
  ble: BleService;
  snapshot: BleSnapshot;
  blocker: HomeBlocker;
  recentlyHidden: NearbyDevice | null;
  startScan: () => void;
  stopScan: () => void;
  dismissBlocker: () => void;
  hideDevice: (id: string) => NearbyDevice | undefined;
  undoHide: () => void;
  clearHiddenToast: () => void;
}

const PulserasContext = createContext<PulserasContextValue | null>(null);

export function PulserasProvider({ children }: { children: ReactNode }) {
  const ble = getMockBleService();
  const snapshot = useSyncExternalStore(
    ble.subscribe,
    ble.getSnapshot,
    ble.getServerSnapshot,
  );
  const [dismissed, setDismissed] = useState<HomeBlocker>(null);
  const [recentlyHidden, setRecentlyHidden] = useState<NearbyDevice | null>(null);

  const permissionBlocked =
    snapshot.nearbyPermission !== "granted" || snapshot.locationPermission !== "granted";
  const blocker: HomeBlocker = !snapshot.bluetoothEnabled
    ? dismissed === "bluetooth"
      ? null
      : "bluetooth"
    : permissionBlocked
      ? dismissed === "permission"
        ? null
        : "permission"
      : null;

  const startScan = useCallback(() => {
    const result = ble.startScan();
    if (!result.ok) {
      setDismissed(null);
    }
  }, [ble]);

  const stopScan = useCallback(() => {
    ble.stopScan();
  }, [ble]);

  const dismissBlocker = useCallback(() => {
    if (!snapshot.bluetoothEnabled) setDismissed("bluetooth");
    else setDismissed("permission");
  }, [snapshot.bluetoothEnabled]);

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
