"use client";

import type { Dispatch, SetStateAction } from "react";

import type { Provider } from "@acme/configurator/providers";

import ProviderSelect from "../ProviderSelect";

interface TrackingProvidersSectionProps {
  trackingProviders: string[];
  setTrackingProviders: Dispatch<SetStateAction<string[]>>;
  shippingProviders: Provider[];
  errors: Record<string, string[]>;
}

export default function TrackingProvidersSection({
  trackingProviders,
  setTrackingProviders,
  shippingProviders,
  errors,
}: TrackingProvidersSectionProps) {
  return (
    <div className="space-y-4">
      <ProviderSelect
        trackingProviders={trackingProviders}
        setTrackingProviders={setTrackingProviders}
        shippingProviders={shippingProviders}
        errors={errors}
      />
    </div>
  );
}
