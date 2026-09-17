"use client";

import { DeviceCard } from "@/components/DeviceCard";
import { EmptyGlyph, ScanningRadar } from "@/components/ScanningRadar";
import { HomeHeader } from "@/components/HomeHeader";
import { StatusBanner } from "@/components/StatusBanner";
import { usePulseras } from "@/context/PulserasContext";
import { formatRelativeTime } from "@/lib/proximity";
import Link from "next/link";
import { useEffect, useState } from "react";

export function HomeScreen() {
  const { ble, snapshot, blocker, startScan, stopScan, dismissBlocker } = usePulseras();
  const [now, setNow] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 8000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const devices = snapshot.devices;
  const scanning = snapshot.status === "scanning";
  const stale = snapshot.status === "stopped" && devices.length > 0;
  const showRadar = scanning && devices.length < 3;
  const lastScanLabel = snapshot.lastScanAt
    ? formatRelativeTime(snapshot.lastScanAt, now).replace("Just now", "just now")
    : null;
  const advertisingLabel = snapshot.advertising ? " · Advertising" : "";

  async function toggleAdvertising() {
    if (snapshot.advertising) {
      await ble.stopAdvertising();
      setNotice(null);
      return;
    }
    const result = await ble.startAdvertising();
    if (!result.ok) {
      setNotice(result.message ?? "Unable to start BLE advertising.");
    } else {
      setNotice(null);
    }
  }

  const advertiseButton = (
    <button
      type="button"
      className={snapshot.advertising ? "btn-ghost" : "btn-outline-accent"}
      onClick={() => void toggleAdvertising()}
    >
      {snapshot.advertising ? "Stop Advertising" : "Start Advertising"}
    </button>
  );

  return (
    <div className="screen-stack">
      <HomeHeader />

      {blocker === "unsupported" ? (
        <>
          <StatusBanner tone="danger">Bluetooth unavailable</StatusBanner>
          <div className="empty-panel">
            <EmptyGlyph />
            <h2 className="empty-title">BLE scanning unsupported</h2>
            <p className="empty-copy">
              This device cannot scan for Bluetooth Low Energy advertisements.
              {snapshot.lastError ? ` ${snapshot.lastError}` : ""}
            </p>
            <button type="button" className="btn-ghost" onClick={dismissBlocker}>
              Dismiss
            </button>
          </div>
        </>
      ) : blocker === "bluetooth" ? (
        <>
          <StatusBanner tone="danger">Bluetooth is off</StatusBanner>
          <div className="empty-panel">
            <EmptyGlyph />
            <h2 className="empty-title">Bluetooth unavailable</h2>
            <p className="empty-copy">
              Pulseras needs Bluetooth to detect nearby devices. Enable it in
              your device settings.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (snapshot.mode === "native") void ble.openBluetoothSettings();
                else ble.setBluetoothEnabled(true);
              }}
            >
              Open Bluetooth Settings
            </button>
            {snapshot.mode !== "native" ? (
              <Link href="/settings" className="btn-ghost">
                Go to Settings
              </Link>
            ) : null}
            <button type="button" className="btn-ghost" onClick={dismissBlocker}>
              Dismiss
            </button>
          </div>
        </>
      ) : blocker === "permission" ? (
        <>
          <StatusBanner tone="gold">Permission required</StatusBanner>
          <div className="empty-panel">
            <EmptyGlyph variant="shield" />
            <h2 className="empty-title">Nearby devices permission denied</h2>
            <p className="empty-copy">
              Pulseras needs permission to scan for nearby Bluetooth devices.
              Grant access in app settings.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (snapshot.mode === "native") void ble.openAppSettings();
                else void ble.requestBluetoothPermissions();
              }}
            >
              Open App Settings
            </button>
            <button type="button" className="btn-ghost" onClick={dismissBlocker}>
              Not Now
            </button>
          </div>
        </>
      ) : blocker === "error" ? (
        <>
          <StatusBanner tone="danger">Scan error</StatusBanner>
          <div className="empty-panel">
            <EmptyGlyph />
            <h2 className="empty-title">Unable to scan</h2>
            <p className="empty-copy">
              {snapshot.lastError ?? "Bluetooth scanning failed. Try again."}
            </p>
            <button type="button" className="btn-primary" onClick={() => void startScan()}>
              Try again
            </button>
            <button type="button" className="btn-ghost" onClick={dismissBlocker}>
              Dismiss
            </button>
          </div>
        </>
      ) : (
        <>
          {scanning ? (
            <StatusBanner tone="mint">
              {showRadar ? "Scanning for devices..." : "Scanning active"}
              {advertisingLabel}
            </StatusBanner>
          ) : stale ? (
            <StatusBanner tone="orange">
              Scanning stopped
              {lastScanLabel ? ` · Last scan ${lastScanLabel}` : null}
              {advertisingLabel}
            </StatusBanner>
          ) : (
            <StatusBanner tone={snapshot.advertising ? "mint" : "idle"}>
              {snapshot.advertising ? "Advertising · Scanning idle" : "Scanning idle"}
            </StatusBanner>
          )}

          {devices.length === 0 && !scanning ? (
            <div className="empty-panel">
              <EmptyGlyph />
              <h2 className="empty-title">No devices found</h2>
              <p className="empty-copy">
                Start scanning to detect nearby Bluetooth devices in your
                vicinity.
                {snapshot.lastError && !notice ? ` ${snapshot.lastError}` : ""}
                {snapshot.mode === "mock"
                  ? " Web builds use simulated devices."
                  : ""}
              </p>
              <button type="button" className="btn-primary" onClick={() => void startScan()}>
                Start Scanning
              </button>
              {advertiseButton}
            </div>
          ) : (
            <>
              {showRadar ? <ScanningRadar /> : null}

              <div className="list-heading">
                <p>
                  {stale
                    ? `${devices.length} devices · Stale data`
                    : scanning
                      ? showRadar
                        ? `Found ${devices.length} device${devices.length === 1 ? "" : "s"}`
                        : `${devices.length} devices found`
                      : `${devices.length} devices found`}
                </p>
                {scanning && !showRadar ? (
                  <button type="button" className="btn-chip" onClick={stopScan}>
                    Stop
                  </button>
                ) : null}
                {stale ? (
                  <button type="button" className="btn-chip" onClick={startScan}>
                    Rescan
                  </button>
                ) : null}
              </div>

              <ul className="device-list">
                {devices.map((device) => (
                  <li key={device.id}>
                    <DeviceCard device={device} />
                  </li>
                ))}
              </ul>

              {showRadar ? (
                <button type="button" className="btn-ghost" onClick={stopScan}>
                  Stop Scanning
                </button>
              ) : null}
              {advertiseButton}
            </>
          )}
        </>
      )}

      {notice ? (
        <div className="action-toast" role="alert">
          <p className="min-w-0 flex-1 text-[0.9rem] font-medium text-white">{notice}</p>
          <button
            type="button"
            className="text-[0.9rem] font-semibold text-[var(--accent)]"
            onClick={() => setNotice(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
