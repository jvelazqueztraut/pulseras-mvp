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
            This MVP simulates nearby BLE devices locally. Scan results, hidden
            devices, and settings are stored only in this browser.
          </p>
          <p>
            Pulseras does not pair with devices, does not upload identifiers,
            and does not require an account.
          </p>
        </div>
      </article>
    </div>
  );
}
