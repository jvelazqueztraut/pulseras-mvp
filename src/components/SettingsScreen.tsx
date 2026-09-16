"use client";

import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsRow, Toggle } from "@/components/SettingsRow";
import {
  BluetoothIcon,
  CheckIcon,
  ChevronRightIcon,
  EyeOffIcon,
  InfoIcon,
  ShieldIcon,
  WifiIcon,
} from "@/components/icons";
import { usePulseras } from "@/context/PulserasContext";
import { useState } from "react";

const INTERVALS = [
  { ms: 2000, label: "Every 2 seconds" },
  { ms: 5000, label: "Every 5 seconds" },
  { ms: 10000, label: "Every 10 seconds" },
  { ms: 15000, label: "Every 15 seconds" },
];

export function SettingsScreen() {
  const { ble, snapshot } = usePulseras();
  const [intervalOpen, setIntervalOpen] = useState(false);
  const intervalLabel =
    INTERVALS.find((item) => item.ms === snapshot.scanIntervalMs)?.label ??
    `Every ${Math.round(snapshot.scanIntervalMs / 1000)} seconds`;
  const hiddenCount = snapshot.hidden.length;

  return (
    <div className="screen-stack">
      <ScreenHeader title="Settings" />

      <section>
        <h2 className="section-label">Bluetooth</h2>
        <div className="settings-group">
          <SettingsRow
            icon={<BluetoothIcon className="h-[18px] w-[18px]" />}
            title="Bluetooth"
            subtitle={snapshot.bluetoothEnabled ? "Available · On" : "Unavailable · Off"}
            trailing={
              <Toggle
                checked={snapshot.bluetoothEnabled}
                label="Bluetooth"
                onChange={(next) => ble.setBluetoothEnabled(next)}
              />
            }
          />
          <SettingsRow
            icon={<WifiIcon className="h-[18px] w-[18px]" />}
            title="Scan interval"
            subtitle={intervalLabel}
            trailing={<ChevronRightIcon className="h-5 w-5 text-[var(--muted)]" />}
            onClick={() => setIntervalOpen(true)}
          />
        </div>
      </section>

      <section>
        <h2 className="section-label">Permissions</h2>
        <div className="settings-group">
          <SettingsRow
            icon={<ShieldIcon className="h-[18px] w-[18px]" />}
            title="Nearby devices"
            subtitle={snapshot.nearbyPermission === "granted" ? "Granted" : "Denied"}
            trailing={
              snapshot.nearbyPermission === "granted" ? (
                <CheckIcon className="h-5 w-5 text-[var(--mint)]" />
              ) : (
                <Toggle
                  checked={false}
                  label="Nearby devices permission"
                  onChange={(next) => ble.setNearbyPermission(next ? "granted" : "denied")}
                />
              )
            }
            onClick={
              snapshot.nearbyPermission === "granted"
                ? () => ble.setNearbyPermission("denied")
                : undefined
            }
          />
          <SettingsRow
            icon={<ShieldIcon className="h-[18px] w-[18px]" />}
            title="Location (coarse)"
            subtitle={
              snapshot.locationPermission === "granted"
                ? "Granted (required for BLE)"
                : "Denied (required for BLE)"
            }
            trailing={
              snapshot.locationPermission === "granted" ? (
                <CheckIcon className="h-5 w-5 text-[var(--mint)]" />
              ) : (
                <Toggle
                  checked={false}
                  label="Location permission"
                  onChange={(next) => ble.setLocationPermission(next ? "granted" : "denied")}
                />
              )
            }
            onClick={
              snapshot.locationPermission === "granted"
                ? () => ble.setLocationPermission("denied")
                : undefined
            }
          />
        </div>
      </section>

      <section>
        <h2 className="section-label">Hidden devices</h2>
        <div className="settings-group">
          <SettingsRow
            icon={<EyeOffIcon className="h-[18px] w-[18px]" />}
            title="Hidden devices"
            subtitle={
              hiddenCount === 1 ? "1 device hidden" : `${hiddenCount} devices hidden`
            }
            trailing={<ChevronRightIcon className="h-5 w-5 text-[var(--muted)]" />}
            href="/settings/hidden"
          />
        </div>
      </section>

      <section>
        <h2 className="section-label">About</h2>
        <div className="settings-group">
          <SettingsRow
            icon={<InfoIcon className="h-[18px] w-[18px]" />}
            title="How BLE proximity works"
            subtitle="Estimated via signal strength"
            trailing={<ChevronRightIcon className="h-5 w-5 text-[var(--muted)]" />}
            href="/settings/proximity"
          />
          <SettingsRow
            icon={<ShieldIcon className="h-[18px] w-[18px]" />}
            title="Privacy"
            subtitle="No data leaves your device"
            trailing={<ChevronRightIcon className="h-5 w-5 text-[var(--muted)]" />}
            href="/settings/privacy"
          />
        </div>
      </section>

      {intervalOpen ? (
        <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="interval-title">
          <button
            type="button"
            className="sheet-backdrop"
            aria-label="Close"
            onClick={() => setIntervalOpen(false)}
          />
          <div className="sheet-panel">
            <div className="sheet-handle" />
            <h2 id="interval-title" className="mt-5 text-[1.15rem] font-semibold text-white">
              Scan interval
            </h2>
            <p className="mt-2 text-[0.9rem] text-[var(--muted)]">
              How often Pulseras refreshes nearby mock BLE signals.
            </p>
            <div className="mt-5 grid gap-2">
              {INTERVALS.map((item) => (
                <button
                  key={item.ms}
                  type="button"
                  className={`interval-option ${
                    item.ms === snapshot.scanIntervalMs ? "is-active" : ""
                  }`}
                  onClick={() => {
                    ble.setScanInterval(item.ms);
                    setIntervalOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
