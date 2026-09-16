export type NearbyDevice = {
  id: string;
  name: string;
  rssi: number;
  meters: number;
};

const NAMES = [
  "Luna",
  "Sol",
  "Nube",
  "Rio",
  "Cobre",
  "Jade",
  "Fuego",
  "Sal",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rssiToMeters(rssi: number) {
  // Simulated free-space path loss at 2.4 GHz. Good enough for the MVP preview.
  const meters = 10 ** ((-50 - rssi) / 25);
  return clamp(Number(meters.toFixed(1)), 0.3, 18);
}

export function createSimulatedScan(): NearbyDevice[] {
  const count = 3 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, (_, index) => {
    const rssi = -42 - Math.floor(Math.random() * 48);
    return {
      id: `sim-${index}-${NAMES[index % NAMES.length]}`,
      name: `Pulsera ${NAMES[index % NAMES.length]}`,
      rssi,
      meters: rssiToMeters(rssi),
    };
  }).sort((a, b) => a.meters - b.meters);
}

export function jitterScan(devices: NearbyDevice[]): NearbyDevice[] {
  return devices
    .map((device) => {
      const rssi = clamp(device.rssi + (Math.random() * 6 - 3), -95, -35);
      return {
        ...device,
        rssi: Math.round(rssi),
        meters: rssiToMeters(rssi),
      };
    })
    .sort((a, b) => a.meters - b.meters);
}
