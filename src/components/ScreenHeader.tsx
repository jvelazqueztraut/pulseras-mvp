"use client";

import Link from "next/link";
import { ChevronLeftIcon } from "./icons";

export function ScreenHeader({
  title,
  backHref = "/",
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="flex items-center gap-3 pt-1">
      <Link href={backHref} className="icon-button" aria-label="Go back">
        <ChevronLeftIcon className="h-5 w-5" />
      </Link>
      <h1 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white">
        {title}
      </h1>
    </header>
  );
}
