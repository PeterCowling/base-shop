// apps/cms/src/app/cms/shop/[shop]/settings/SEOSettings.tsx
"use client";
import { Input } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { Provider } from "@acme/configurator/providers";

interface Props {
  info: Shop;
  setInfo: Dispatch<SetStateAction<Shop>>;
  trackingProviders: string[];
  setTrackingProviders: Dispatch<SetStateAction<string[]>>;
  errors: Record<string, string[]>;
  shippingProviders: Provider[];
}

export default function SEOSettings({
  info,
  setInfo,
  trackingProviders,
  setTrackingProviders,
  errors,
  shippingProviders,
}: Props) {
  const handleFilters = (e: ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({
      ...prev,
      catalogFilters: e.target.value.split(/,\s*/),
    }));
  };

  const handleTracking = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
    setTrackingProviders(selected);
  };

  return (
    <>
      <label className="flex flex-col gap-1">
        <span>Catalog Filters (comma separated)</span>
        <Input
          className="border p-2"
          name="catalogFilters"
          value={info.catalogFilters.join(",")}
          onChange={handleFilters}
        />
        {errors.catalogFilters && (
          <span className="text-sm text-red-600">
            {errors.catalogFilters.join("; ")}
          </span>
        )}
      </label>
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
    </>
  );
}
