import type { Proximity } from "./types";

export function proximityFromRssi(rssi: number | null): Proximity {
  if (rssi == null) return "Unknown";
  if (rssi >= -50) return "Very close";
  if (rssi >= -62) return "Close";
  if (rssi >= -75) return "Nearby";
  if (rssi >= -88) return "Far";
  return "Unknown";
}

export function proximityTone(proximity: Proximity): "mint" | "gold" | "orange" | "muted" {
  switch (proximity) {
    case "Very close":
    case "Close":
      return "mint";
    case "Nearby":
      return "gold";
    case "Far":
      return "orange";
    default:
      return "muted";
  }
}

export function formatRelativeTime(timestamp: number | null, now = Date.now()): string {
  if (timestamp == null) return "Unknown";
  const delta = Math.max(0, now - timestamp);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 2) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 min ago" : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
}

export function formatRssi(rssi: number | null): string {
  if (rssi == null) return "—";
  return `${rssi} dBm`;
}
