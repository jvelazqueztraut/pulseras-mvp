const STORAGE_KEY = "pulseras:v1";

export interface PersistedState {
  bluetoothEnabled: boolean;
  nearbyPermission: "granted" | "denied" | "prompt";
  locationPermission: "granted" | "denied" | "prompt";
  scanIntervalMs: number;
  hidden: { id: string; hiddenAt: number }[];
}

export const DEFAULT_PERSISTED: PersistedState = {
  bluetoothEnabled: true,
  nearbyPermission: "granted",
  locationPermission: "granted",
  scanIntervalMs: 5000,
  hidden: [],
};

export function loadPersisted(): PersistedState {
  if (typeof window === "undefined") return DEFAULT_PERSISTED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
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
    };
  } catch {
    return DEFAULT_PERSISTED;
  }
}

export function savePersisted(state: PersistedState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
