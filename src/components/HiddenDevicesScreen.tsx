"use client";

import { ScreenHeader } from "@/components/ScreenHeader";
import { BluetoothIcon } from "@/components/icons";
import { usePulseras } from "@/context/PulserasContext";
import { formatRelativeTime } from "@/lib/proximity";
import { useEffect, useState } from "react";

export function HiddenDevicesScreen() {
  const { ble, snapshot } = usePulseras();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const items = snapshot.hidden.map((hidden) => ({
    ...hidden,
    name: hidden.name || "Unknown device",
    address: hidden.address || "—",
  }));

  return (
    <div className="screen-stack">
      <ScreenHeader title="Hidden devices" backHref="/settings" />

      <p className="info-note compact">
        Hidden devices are excluded from your list. Restore them here at any
        time.
      </p>

      <p className="section-label">
        {items.length === 1 ? "1 hidden device" : `${items.length} hidden devices`}
      </p>

      {items.length === 0 ? (
        <p className="empty-copy px-1">No hidden devices right now.</p>
      ) : (
        <ul className="device-list">
          {items.map((item) => (
            <li key={item.id} className="hidden-card">
              <span className="device-glyph" aria-hidden="true">
                <BluetoothIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-white">
                  {item.name}
                </span>
                <span className="mt-0.5 block font-mono text-[0.72rem] text-[var(--muted)]">
                  {item.address}
                </span>
                <span className="mt-1 block text-[0.75rem] text-[var(--muted)]">
                  Hidden {formatRelativeTime(item.hiddenAt, now)}
                </span>
              </span>
              <button
                type="button"
                className="text-[0.9rem] font-semibold text-[var(--accent)]"
                onClick={() => ble.restoreDevice(item.id)}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="btn-outline-accent"
        onClick={() => ble.restoreAll()}
        disabled={items.length === 0}
      >
        Restore all devices
      </button>
      <button type="button" className="btn-ghost" onClick={() => ble.resetDemo()}>
        Reset demo data
      </button>
    </div>
  );
}
