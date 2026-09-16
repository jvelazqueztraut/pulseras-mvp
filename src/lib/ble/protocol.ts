/**
 * Pulseras BLE advertisement format, version 1.
 *
 * Scanning uses `@capacitor-community/bluetooth-le` (central role only).
 * Advertising uses a native Android adapter (`PulserasAdvertiser`) because the
 * community plugin does not implement the peripheral role.
 *
 * Payload (no PII):
 * - Local name: "Pulseras" (product name, not a user identity)
 * - Service UUID: PULSERAS_SERVICE_UUID
 * - Manufacturer data (company ID 0xFFFF, development/testing ID):
 *   [version=0x01, 8 anonymous bytes]
 *
 * The anonymous identifier is generated on-device and stored locally. It is
 * not a name, email, phone number, or account id.
 */
export const PULSERAS_BLE_VERSION = 1;
export const PULSERAS_SERVICE_UUID = "8f2a4c10-9b7e-4d31-9c4a-1f6e8b2d0a01";
export const PULSERAS_LOCAL_NAME = "Pulseras";
export const PULSERAS_MANUFACTURER_ID = 0xffff;

export function normalizeUuid(value: string | undefined | null): string {
  return (value ?? "").replace(/[{}]/g, "").trim().toLowerCase();
}

export function isPulserasServiceUuid(value: string | undefined | null): boolean {
  return normalizeUuid(value) === normalizeUuid(PULSERAS_SERVICE_UUID);
}
