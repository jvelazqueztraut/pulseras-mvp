"use client";

import { DeviceDetailsScreen } from "@/components/DeviceDetailsScreen";
import { use } from "react";

export default function DevicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <DeviceDetailsScreen id={id} />;
}
