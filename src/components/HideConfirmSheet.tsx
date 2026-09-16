"use client";

import { EyeOffIcon } from "./icons";

export function HideConfirmSheet({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sheet-root" role="dialog" aria-modal="true" aria-labelledby="hide-title">
      <button type="button" className="sheet-backdrop" aria-label="Close" onClick={onCancel} />
      <div className="sheet-panel">
        <div className="sheet-handle" />
        <div className="mt-5 flex items-start gap-3">
          <span className="hide-glyph" aria-hidden="true">
            <EyeOffIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="hide-title" className="text-[1.15rem] font-semibold text-white">
              Hide this device?
            </h2>
            <p className="mt-1 text-[0.92rem] text-[var(--muted)]">{name}</p>
          </div>
        </div>
        <p className="mt-5 text-[0.92rem] leading-6 text-[var(--muted)]">
          This device will no longer appear in your list. You can restore it from
          Settings at any time.
        </p>
        <button type="button" className="btn-danger mt-6" onClick={onConfirm}>
          Hide device
        </button>
        <button type="button" className="btn-ghost mt-3" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
