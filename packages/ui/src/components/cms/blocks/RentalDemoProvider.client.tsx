"use client";

import { useEffect } from "react";

import { configureAvailabilityAdapter } from "@acme/platform-core/rental/availability";
import { createDemoAvailabilityAdapter } from "@acme/platform-core/rental/demoAdapter";

export default function RentalDemoProvider() {
  useEffect(() => {
    try {
      configureAvailabilityAdapter(createDemoAvailabilityAdapter());
    } catch {}
  }, []);
  return null;
}

