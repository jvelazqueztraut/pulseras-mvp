"use client";

import { ScreenHeader } from "@/components/ScreenHeader";

export default function PrivacyPage() {
  return (
    <div className="screen-stack">
      <ScreenHeader title="Privacy" backHref="/settings" />
      <article className="prose-panel info-note compact">
        <div>
          <h2>No data leaves your device</h2>
          <p>
            Scan results, hidden devices, and settings stay on this device.
            Browser builds use simulated BLE data. The Android app scans local
            advertisements and does not upload identifiers.
          </p>
          <p>
            Pulseras does not pair with devices, does not require an account,
            and advertising uses an anonymous local identifier plus a public
            Pulseras service UUID.
          </p>
        </div>
      </article>
    </div>
  );
}
