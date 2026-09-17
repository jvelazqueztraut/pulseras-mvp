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
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  dismissBlocker: () => void;
  hideDevice: (id: string) => NearbyDevice | undefined;
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
    (id: string) => ble.hideDevice(id),
    [ble],
  );

  const value = useMemo(
    () => ({
      ble,
      snapshot,
      blocker,
      startScan,
      stopScan,
      dismissBlocker,
      hideDevice,
    }),
    [ble, snapshot, blocker, startScan, stopScan, dismissBlocker, hideDevice],
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
