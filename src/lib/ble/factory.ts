import { Capacitor } from "@capacitor/core";
import { createMockBleService } from "./mockBleService";
import { createNativeBleService } from "./nativeBleService";
import type { BleService } from "../types";

let singleton: BleService | null = null;

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

export function createBleService(): BleService {
  if (isNativeAndroid()) {
    return createNativeBleService();
  }
  return createMockBleService();
}

export function getBleService(): BleService {
  if (!singleton) singleton = createBleService();
  return singleton;
}

export function resetBleService(): void {
  singleton?.destroy();
  singleton = null;
}
