"use client";

import type { Provider } from "@acme/configurator/providers";
import type { Dispatch, SetStateAction, ChangeEvent } from "react";

interface TrackingProvidersSectionProps {
  trackingProviders: string[];
  setTrackingProviders: Dispatch<SetStateAction<string[]>>;
  errors: Record<string, string[]>;
  shippingProviders: Provider[];
}

export default function TrackingProvidersSection({
  trackingProviders,
  setTrackingProviders,
  errors,
  shippingProviders,
}: TrackingProvidersSectionProps) {
  const handleTracking = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map(
      (option) => option.value,
    );
    setTrackingProviders(selected);
  };

  return (
    <label className="flex flex-col gap-1">
      <span>Tracking Providers</span>
      <select
        multiple
        name="trackingProviders"
        value={trackingProviders}
        onChange={handleTracking}
        className="border p-2"
      >
        {shippingProviders.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
          </option>
        ))}
      </select>
      {errors.trackingProviders && (
        <span className="text-sm text-red-600">
          {errors.trackingProviders.join("; ")}
        </span>
      )}
    </label>
  );
}
