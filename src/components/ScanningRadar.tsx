"use client";

import { BluetoothIcon } from "./icons";

export function ScanningRadar() {
  return (
    <div className="radar" role="status" aria-live="polite">
      <span className="radar-ring radar-ring-1" />
      <span className="radar-ring radar-ring-2" />
      <span className="radar-core">
        <BluetoothIcon className="h-7 w-7" />
      </span>
      <p className="mt-4 text-center text-[0.82rem] text-[var(--muted)]">
        Detecting BLE signals
      </p>
    </div>
  );
}

export function EmptyGlyph({
  variant = "bluetooth",
}: {
  variant?: "bluetooth" | "shield";
}) {
  return (
    <div className="empty-glyph" aria-hidden="true">
      {variant === "shield" ? (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
          <path
            d="M12 3.5 5.5 6.2v5.3c0 4.2 2.7 7.2 6.5 8.5 3.8-1.3 6.5-4.3 6.5-8.5V6.2L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <BluetoothIcon className="h-8 w-8" />
      )}
    </div>
  );
}
