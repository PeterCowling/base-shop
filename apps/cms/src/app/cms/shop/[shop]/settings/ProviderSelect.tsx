// apps/cms/src/app/cms/shop/[shop]/settings/ProviderSelect.tsx
"use client";
import { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { Provider } from "@acme/configurator/providers";

interface Props {
  trackingProviders: string[];
  setTrackingProviders: Dispatch<SetStateAction<string[]>>;
  errors: Record<string, string[]>;
  shippingProviders: Provider[];
}

export default function ProviderSelect({
  trackingProviders,
  setTrackingProviders,
  errors,
  shippingProviders,
}: Props) {
  const handleTracking = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
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
        {shippingProviders.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
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

