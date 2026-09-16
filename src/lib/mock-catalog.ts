import type { NearbyDevice } from "./types";

export const DEVICE_CATALOG: Omit<NearbyDevice, "rssi" | "lastSeenAt">[] = [
  {
    id: "galaxy-s24-ultra",
    name: "Galaxy S24 Ultra",
    address: "E4:B7:A2:1C",
    protocol: "BLE",
  },
  {
    id: "unknown-2a",
    name: "Unknown device",
    address: "2A:FF:9C:44",
    protocol: "BLE",
  },
  {
    id: "pixel-8-pro",
    name: "Pixel 8 Pro",
    address: "B0:12:3E:77",
    protocol: "BLE",
  },
  {
    id: "oneplus-12",
    name: "OnePlus 12",
    address: "7C:4E:D1:03",
    protocol: "BLE",
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    address: "A9:B8:2F:CC",
    protocol: "BLE",
  },
  {
    id: "unknown-1f",
    name: "Unknown device",
    address: "1F:30:B4:E9",
    protocol: "BLE",
  },
  {
    id: "unknown-9d",
    name: "Unknown device",
    address: "9D:11:C8:02",
    protocol: "BLE",
  },
  {
    id: "pixel-fold",
    name: "Pixel Fold",
    address: "C3:90:AA:18",
    protocol: "BLE",
  },
];

export const BASE_RSSI: Record<string, number> = {
  "galaxy-s24-ultra": -42,
  "unknown-2a": -55,
  "pixel-8-pro": -68,
  "oneplus-12": -58,
  "iphone-15": -82,
  "unknown-1f": -94,
  "unknown-9d": -71,
  "pixel-fold": -60,
};
