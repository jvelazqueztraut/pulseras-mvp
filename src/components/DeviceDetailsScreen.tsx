"use client";

import { HideConfirmSheet } from "@/components/HideConfirmSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BluetoothIcon } from "@/components/icons";
import { usePulseras } from "@/context/PulserasContext";
import {
  formatRelativeTime,
  formatRssi,
  proximityFromRssi,
  proximityTone,
} from "@/lib/proximity";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function DeviceDetailsScreen({ id }: { id: string }) {
  const { ble, snapshot, hideDevice } = usePulseras();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!id) {
    notFound();
    return null;
  }

  const hidden = snapshot.hidden.some((item) => item.id === id);
  const live = ble.getDevice(id);
  const remembered = snapshot.devices.find((item) => item.id === id);
  const hiddenDevice = ble.getHiddenDevice(id);

  if (hidden && !live) {
    notFound();
    return null;
  }

  const view = live ?? remembered ?? hiddenDevice;
  if (!view) {
    notFound();
    return null;
  }

  const proximity = proximityFromRssi(view.rssi);
  const tone = proximityTone(proximity);

  return (
    <div className="screen-stack">
      <ScreenHeader title="Device details" />

      <section className="detail-hero">
        <span className="device-glyph lg" aria-hidden="true">
          <BluetoothIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[1.25rem] font-semibold tracking-[-0.03em] text-white">
            {view.name}
          </h2>
          <p className="mt-1 font-mono text-[0.78rem] tracking-wide text-[var(--muted)]">
            {view.address}
          </p>
        </div>
      </section>

      <section className="detail-table" aria-label="Device measurements">
        <div className="detail-row">
          <span>Proximity</span>
          <span className={`proximity proximity-${tone}`}>
            <span className="dot" />
            {proximity}
          </span>
        </div>
        <div className="detail-row">
          <span>Signal strength</span>
          <strong>{formatRssi(view.rssi)}</strong>
        </div>
        <div className="detail-row">
          <span>Last detected</span>
          <strong>{formatRelativeTime(view.lastSeenAt, now)}</strong>
        </div>
        <div className="detail-row">
          <span>Protocol</span>
          <strong>
            {view.pulserasPeer ? "BLE · Pulseras" : "BLE (Bluetooth Low Energy)"}
          </strong>
        </div>
      </section>

      <p className="info-note">
        <span className="info-note-mark" aria-hidden="true">
          i
        </span>
        Proximity is estimated from signal strength and may vary. Pulseras does
        not measure physical distance.
      </p>

      <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
        Hide device
      </button>

      {confirming ? (
        <HideConfirmSheet
          name={view.name}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            hideDevice(id);
            router.push("/");
          }}
        />
      ) : null}
    </div>
  );
}
