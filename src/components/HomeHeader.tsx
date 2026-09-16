"use client";

import Link from "next/link";
import { GearIcon } from "./icons";

export function HomeHeader() {
  return (
    <header className="flex items-start justify-between gap-4 pt-1">
      <div>
        <p className="brand-kicker">Pulseras</p>
        <h1 className="mt-1 text-[1.85rem] font-semibold leading-none tracking-[-0.03em] text-white">
          Nearby devices
        </h1>
      </div>
      <Link
        href="/settings"
        className="icon-button"
        aria-label="Open settings"
      >
        <GearIcon className="h-5 w-5" />
      </Link>
    </header>
  );
}
