"use client";

import type { ReactNode } from "react";

export function StatusBanner({
  tone,
  children,
}: {
  tone: "idle" | "mint" | "orange" | "danger" | "gold";
  children: ReactNode;
}) {
  return (
    <div className={`status-banner status-${tone}`} role="status">
      <span className="status-dot" />
      <span>{children}</span>
    </div>
  );
}
