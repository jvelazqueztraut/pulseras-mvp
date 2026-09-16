const STORAGE_KEY = "pulseras:v1";

export interface PersistedState {
  bluetoothEnabled: boolean;
  nearbyPermission: "granted" | "denied" | "prompt";
  locationPermission: "granted" | "denied" | "prompt";
  scanIntervalMs: number;
  hidden: { id: string; hiddenAt: number; name?: string; address?: string }[];
  anonymousId: string;
}

function createAnonymousId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export const DEFAULT_PERSISTED: PersistedState = {
  bluetoothEnabled: true,
  nearbyPermission: "granted",
  locationPermission: "granted",
  scanIntervalMs: 5000,
  hidden: [],
  anonymousId: "0000000000000000",
};

export function loadPersisted(): PersistedState {
  if (typeof window === "undefined") return { ...DEFAULT_PERSISTED, anonymousId: createAnonymousId() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = { ...DEFAULT_PERSISTED, anonymousId: createAnonymousId() };
      savePersisted(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const state: PersistedState = {
      bluetoothEnabled: parsed.bluetoothEnabled ?? true,
      nearbyPermission:
        parsed.nearbyPermission === "denied" || parsed.nearbyPermission === "prompt"
          ? parsed.nearbyPermission
          : "granted",
      locationPermission:
        parsed.locationPermission === "denied" || parsed.locationPermission === "prompt"
          ? parsed.locationPermission
          : "granted",
      scanIntervalMs:
        typeof parsed.scanIntervalMs === "number" ? parsed.scanIntervalMs : 5000,
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      anonymousId:
        typeof parsed.anonymousId === "string" && parsed.anonymousId.length >= 8
          ? parsed.anonymousId
          : createAnonymousId(),
    };
    if (!parsed.anonymousId) savePersisted(state);
    return state;
  } catch {
    return { ...DEFAULT_PERSISTED, anonymousId: createAnonymousId() };
  }
}

export function savePersisted(state: PersistedState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function anonymousIdToBytes(id: string): number[] {
  const hex = id.replace(/[^a-fA-F0-9]/g, "").slice(0, 16).padEnd(16, "0");
  const bytes: number[] = [];
  for (let i = 0; i < 16; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}
