import { isPulserasServiceUuid, PULSERAS_SERVICE_UUID } from "./protocol";
import type { NearbyDevice } from "../types";

export interface BleScanInput {
  deviceId?: string;
  name?: string | null;
  localName?: string | null;
  rssi?: number | null;
  uuids?: string[] | null;
}

export function displayDeviceName(localName?: string | null, deviceName?: string | null): string {
  const name = (localName ?? "").trim() || (deviceName ?? "").trim();
  return name.length > 0 ? name : "Unknown device";
}

export function anonymousLabel(deviceId: string): string {
  const hex = deviceId.replace(/[^a-fA-F0-9]/g, "").slice(-8).toUpperCase().padStart(8, "0");
  return hex.match(/.{1,2}/g)?.join(":") ?? "00:00:00:00";
}

export function mapScanResult(input: BleScanInput, now = Date.now()): NearbyDevice | null {
  const id = (input.deviceId ?? "").trim();
  if (!id) return null;
  const uuids = input.uuids ?? [];
  return {
    id,
    name: displayDeviceName(input.localName, input.name),
    address: anonymousLabel(id),
    rssi: typeof input.rssi === "number" && Number.isFinite(input.rssi) ? Math.round(input.rssi) : null,
    lastSeenAt: now,
    protocol: "BLE",
    pulserasPeer: uuids.some((uuid) => isPulserasServiceUuid(uuid)) || input.name === "Pulseras",
  };
}

export function upsertDevice(
  current: Map<string, NearbyDevice>,
  next: NearbyDevice,
): Map<string, NearbyDevice> {
  const previous = current.get(next.id);
  const merged: NearbyDevice = previous
    ? {
        ...previous,
        ...next,
        name:
          next.name !== "Unknown device" || previous.name === "Unknown device"
            ? next.name
            : previous.name,
        rssi: next.rssi ?? previous.rssi,
        pulserasPeer: previous.pulserasPeer || next.pulserasPeer,
      }
    : next;
  const copy = new Map(current);
  copy.set(merged.id, merged);
  return copy;
}

export function filterHiddenDevices(
  devices: NearbyDevice[],
  hiddenIds: Iterable<string>,
): NearbyDevice[] {
  const hidden = new Set(hiddenIds);
  return devices.filter((device) => !hidden.has(device.id));
}

export function pruneStaleDevices(
  devices: Map<string, NearbyDevice>,
  now: number,
  maxAgeMs: number,
): Map<string, NearbyDevice> {
  const next = new Map<string, NearbyDevice>();
  for (const [id, device] of devices) {
    if (device.lastSeenAt != null && now - device.lastSeenAt <= maxAgeMs) {
      next.set(id, device);
    }
  }
  return next;
}

export { PULSERAS_SERVICE_UUID };
