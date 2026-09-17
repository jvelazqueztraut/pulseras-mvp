"use client";

import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsRow, Toggle } from "@/components/SettingsRow";
import { usePulseras } from "@/context/PulserasContext";
import type { AdvertiseMode, AdvertiseTxPower } from "@/lib/ble/advertisingConfig";
import { useState } from "react";

const MODES: { value: AdvertiseMode; label: string; hint: string }[] = [
  { value: "lowPower", label: "Low power", hint: "Least radio use" },
  { value: "balanced", label: "Balanced", hint: "Default Android cadence" },
  { value: "lowLatency", label: "Low latency", hint: "Fastest discovery" },
];

const TX_POWERS: { value: AdvertiseTxPower; label: string }[] = [
  { value: "ultraLow", label: "Ultra low" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function AdvertisingSettingsPage() {
  const { ble, snapshot } = usePulseras();
  const config = snapshot.advertisingConfig;
  const [localName, setLocalName] = useState(config.localName);
  const [descriptor, setDescriptor] = useState(config.descriptor);

  const status = snapshot.advertisingSupported
    ? snapshot.advertising
      ? "Advertising now · start/stop from Home"
      : "Supported · start/stop from Home"
    : snapshot.mode === "native"
      ? "Not supported on this hardware"
      : "Not available in the browser";

  return (
    <div className="screen-stack">
      <ScreenHeader title="BLE advertising" backHref="/settings" />

      <p className="info-note">
        <span className="info-note-mark" aria-hidden="true">
          i
        </span>
        {status}. Keep the advertise packet small: a 128-bit UUID plus
        manufacturer data does not fit in a single 31-byte packet, so extra
        fields go in the scan response.
      </p>

      <section>
        <h2 className="section-label">Payload</h2>
        <div className="settings-group">
          <label className="settings-field">
            <span>Local name</span>
            <input
              className="settings-input"
              value={localName}
              maxLength={11}
              autoComplete="off"
              onChange={(event) => setLocalName(event.target.value)}
              onBlur={() => {
                ble.setAdvertisingConfig({ localName });
                setLocalName(ble.getSnapshot().advertisingConfig.localName);
              }}
            />
          </label>
          <label className="settings-field">
            <span>Descriptor</span>
            <input
              className="settings-input"
              value={descriptor}
              maxLength={8}
              placeholder="Optional short tag"
              autoComplete="off"
              onChange={(event) => setDescriptor(event.target.value)}
              onBlur={() => {
                ble.setAdvertisingConfig({ descriptor });
                setDescriptor(ble.getSnapshot().advertisingConfig.descriptor);
              }}
            />
          </label>
          <SettingsRow
            icon={<span className="text-[0.7rem] font-bold">UUID</span>}
            title="Include service UUID"
            subtitle="Pulseras protocol identifier"
            trailing={
              <Toggle
                checked={config.includeServiceUuid}
                label="Include service UUID"
                onChange={(next) => ble.setAdvertisingConfig({ includeServiceUuid: next })}
              />
            }
          />
          <SettingsRow
            icon={<span className="text-[0.7rem] font-bold">MFG</span>}
            title="Include manufacturer data"
            subtitle="Version, anonymous id, and descriptor"
            trailing={
              <Toggle
                checked={config.includeManufacturerData}
                label="Include manufacturer data"
                onChange={(next) => ble.setAdvertisingConfig({ includeManufacturerData: next })}
              />
            }
          />
          <SettingsRow
            icon={<span className="text-[0.7rem] font-bold">N</span>}
            title="Include local name"
            subtitle="Uses the adapter name in the scan response"
            trailing={
              <Toggle
                checked={config.includeLocalName}
                label="Include local name"
                onChange={(next) => ble.setAdvertisingConfig({ includeLocalName: next })}
              />
            }
          />
          <SettingsRow
            icon={<span className="text-[0.7rem] font-bold">TX</span>}
            title="Include TX power"
            subtitle="Adds transmit power to the scan response"
            trailing={
              <Toggle
                checked={config.includeTxPower}
                label="Include TX power"
                onChange={(next) => ble.setAdvertisingConfig({ includeTxPower: next })}
              />
            }
          />
          <SettingsRow
            icon={<span className="text-[0.7rem] font-bold">C</span>}
            title="Connectable"
            subtitle="Off keeps Pulseras broadcast-only"
            trailing={
              <Toggle
                checked={config.connectable}
                label="Connectable advertising"
                onChange={(next) => ble.setAdvertisingConfig({ connectable: next })}
              />
            }
          />
        </div>
      </section>

      <section>
        <h2 className="section-label">Advertise mode</h2>
        <div className="settings-group">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`interval-option ${config.mode === item.value ? "is-active" : ""}`}
              onClick={() => ble.setAdvertisingConfig({ mode: item.value })}
            >
              {item.label}
              <span className="ml-2 text-[0.78rem] text-[var(--muted)]">{item.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-label">Transmit power</h2>
        <div className="settings-group">
          {TX_POWERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`interval-option ${config.txPower === item.value ? "is-active" : ""}`}
              onClick={() => ble.setAdvertisingConfig({ txPower: item.value })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
