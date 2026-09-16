"use client";

import { ScreenHeader } from "@/components/ScreenHeader";

export default function ProximityPage() {
  return (
    <div className="screen-stack">
      <ScreenHeader title="How BLE proximity works" backHref="/settings" />
      <article className="prose-panel info-note compact">
        <div>
          <h2>Estimated via signal strength</h2>
          <p>
            Pulseras infers qualitative proximity from Bluetooth Low Energy
            signal strength (RSSI). It does not measure physical distance.
          </p>
          <ul>
            <li>Very close — strongest recent signal</li>
            <li>Close — strong signal</li>
            <li>Nearby — moderate signal</li>
            <li>Far — weak signal</li>
            <li>Unknown — too faint or incomplete</li>
          </ul>
          <p>
            Walls, pockets, body position, and radio noise can change the
            reading even when a device stays in the same place.
          </p>
        </div>
      </article>
    </div>
  );
}
