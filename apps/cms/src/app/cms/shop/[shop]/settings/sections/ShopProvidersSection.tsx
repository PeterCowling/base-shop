"use client";

import { Card, CardContent } from "@/components/atoms/shadcn";
import type { Provider } from "@acme/configurator/providers";
import type { ChangeEvent } from "react";

interface ShopProvidersSectionProps {
  trackingProviders: string[];
  shippingProviders: Provider[];
  errors: Record<string, string[]>;
  onTrackingChange: (providers: string[]) => void;
}

export default function ShopProvidersSection({
  trackingProviders,
  shippingProviders,
  errors,
  onTrackingChange,
}: ShopProvidersSectionProps) {
  const handleTrackingChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    onTrackingChange(selected);
  };

  return (
    <Card className="col-span-full">
      <CardContent className="space-y-3 p-6">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tracking Providers</span>
          <select
            multiple
            name="trackingProviders"
            value={trackingProviders}
            onChange={handleTrackingChange}
            className="min-h-[6rem] rounded-md border border-input bg-background px-3 py-2 text-sm"
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
      </CardContent>
    </Card>
  );
}
