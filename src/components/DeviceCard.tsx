"use client";

import { formatRssi, proximityFromRssi, proximityTone } from "@/lib/proximity";
import { deviceDetailsHref } from "@/lib/navigation";
import type { NearbyDevice } from "@/lib/types";
import Link from "next/link";
import { BluetoothIcon, ChevronRightIcon } from "./icons";

export function DeviceCard({ device }: { device: NearbyDevice }) {
  const proximity = proximityFromRssi(device.rssi);
  const tone = proximityTone(proximity);

  return (
    <Link href={deviceDetailsHref(device.id)} className="device-card">
      <span className="device-glyph" aria-hidden="true">
        <BluetoothIcon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-white">
          {device.name}
        </span>
        <span className="mt-0.5 block font-mono text-[0.72rem] tracking-wide text-[var(--muted)]">
          {device.address}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem]">
          <span className={`proximity proximity-${tone}`}>
            <span className="dot" />
            {proximity}
          </span>
          <span className="font-mono text-[var(--muted)]">{formatRssi(device.rssi)}</span>
        </span>
      </span>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-[var(--muted)]" />
    </Link>
  );
}
