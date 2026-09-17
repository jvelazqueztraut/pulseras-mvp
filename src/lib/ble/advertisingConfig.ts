import type { AdvertisingOptions } from "./advertisingPort";
import {
  PULSERAS_BLE_VERSION,
  PULSERAS_LOCAL_NAME,
  PULSERAS_MANUFACTURER_ID,
  PULSERAS_SERVICE_UUID,
} from "./protocol";

export type AdvertiseMode = "lowPower" | "balanced" | "lowLatency";
export type AdvertiseTxPower = "ultraLow" | "low" | "medium" | "high";

export interface AdvertisingConfig {
  localName: string;
  descriptor: string;
  includeServiceUuid: boolean;
  includeManufacturerData: boolean;
  includeLocalName: boolean;
  includeTxPower: boolean;
  connectable: boolean;
  mode: AdvertiseMode;
  txPower: AdvertiseTxPower;
}

export const DEFAULT_ADVERTISING_CONFIG: AdvertisingConfig = {
  localName: PULSERAS_LOCAL_NAME,
  descriptor: "",
  includeServiceUuid: true,
  includeManufacturerData: false,
  includeLocalName: false,
  includeTxPower: false,
  connectable: false,
  mode: "lowLatency",
  txPower: "medium",
};

const MODES: AdvertiseMode[] = ["lowPower", "balanced", "lowLatency"];
const TX_POWERS: AdvertiseTxPower[] = ["ultraLow", "low", "medium", "high"];

export function sanitizeLocalName(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 11) || PULSERAS_LOCAL_NAME;
}

export function sanitizeDescriptor(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 8);
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function mergeAdvertisingConfig(
  base: AdvertisingConfig,
  patch: Partial<AdvertisingConfig> | Record<string, unknown> = {},
): AdvertisingConfig {
  const next = { ...base, ...patch };
  return {
    localName: sanitizeLocalName(typeof next.localName === "string" ? next.localName : base.localName),
    descriptor: sanitizeDescriptor(typeof next.descriptor === "string" ? next.descriptor : base.descriptor),
    includeServiceUuid: asBoolean(next.includeServiceUuid, base.includeServiceUuid),
    includeManufacturerData: asBoolean(next.includeManufacturerData, base.includeManufacturerData),
    includeLocalName: asBoolean(next.includeLocalName, base.includeLocalName),
    includeTxPower: asBoolean(next.includeTxPower, base.includeTxPower),
    connectable: asBoolean(next.connectable, base.connectable),
    mode: MODES.includes(next.mode as AdvertiseMode) ? (next.mode as AdvertiseMode) : base.mode,
    txPower: TX_POWERS.includes(next.txPower as AdvertiseTxPower)
      ? (next.txPower as AdvertiseTxPower)
      : base.txPower,
  };
}

export function buildAdvertisingOptions(
  config: AdvertisingConfig,
  anonymousBytes: number[],
): AdvertisingOptions {
  const descriptor = sanitizeDescriptor(config.descriptor);
  const extra = [...descriptor].map((ch) => ch.charCodeAt(0));
  return {
    serviceUuid: PULSERAS_SERVICE_UUID,
    localName: sanitizeLocalName(config.localName),
    includeServiceUuid: config.includeServiceUuid,
    includeLocalName: config.includeLocalName,
    includeTxPower: config.includeTxPower,
    includeManufacturerData: config.includeManufacturerData,
    connectable: config.connectable,
    mode: config.mode,
    txPower: config.txPower,
    manufacturerId: PULSERAS_MANUFACTURER_ID,
    manufacturerData: [PULSERAS_BLE_VERSION, ...anonymousBytes, ...extra],
  };
}
