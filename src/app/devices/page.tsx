"use client";

import { DeviceDetailsScreen } from "@/components/DeviceDetailsScreen";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function DeviceDetailsRoute() {
  const params = useSearchParams();
  return <DeviceDetailsScreen id={params.get("id") ?? ""} />;
}

export default function DevicePage() {
  return (
    <Suspense>
      <DeviceDetailsRoute />
    </Suspense>
  );
}
