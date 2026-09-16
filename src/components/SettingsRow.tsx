"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  href,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <span className="settings-glyph" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-semibold text-white">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block text-[0.78rem] text-[var(--muted)]">{subtitle}</span>
        ) : null}
      </span>
      {trailing}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="settings-row">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className="settings-row" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className="settings-row">{content}</div>;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? "toggle-on" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}
