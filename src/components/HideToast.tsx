"use client";

import { CheckIcon } from "./icons";

export function HideToast({
  name,
  onUndo,
}: {
  name: string;
  onUndo: () => void;
}) {
  return (
    <div className="hide-toast" role="status" aria-live="polite">
      <span className="hide-toast-check" aria-hidden="true">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <p className="min-w-0 flex-1 truncate text-[0.9rem] font-medium text-white">
        {name} hidden
      </p>
      <button type="button" className="text-[0.9rem] font-semibold text-[var(--accent)]" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
