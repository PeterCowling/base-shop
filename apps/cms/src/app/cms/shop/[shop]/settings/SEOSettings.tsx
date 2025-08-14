"use client";

import { Textarea } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import type { ChangeEvent } from "react";

interface Props {
  info: Shop;
  errors: Record<string, string[]>;
  handleMappings: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handlePriceOverrides: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleLocaleOverrides: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function SEOSettings({
  info,
  errors,
  handleMappings,
  handlePriceOverrides,
  handleLocaleOverrides,
}: Props) {
  return (
    <>
      <label className="flex flex-col gap-1">
        <span>Filter Mappings (JSON)</span>
        <Textarea
          name="filterMappings"
          defaultValue={JSON.stringify(info.filterMappings, null, 2)}
          onChange={handleMappings}
          rows={4}
        />
        {errors.filterMappings && (
          <span className="text-sm text-red-600">
            {errors.filterMappings.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Price Overrides (JSON)</span>
        <Textarea
          name="priceOverrides"
          defaultValue={JSON.stringify(info.priceOverrides ?? {}, null, 2)}
          onChange={handlePriceOverrides}
          rows={4}
        />
        {errors.priceOverrides && (
          <span className="text-sm text-red-600">
            {errors.priceOverrides.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Locale Overrides (JSON)</span>
        <Textarea
          name="localeOverrides"
          defaultValue={JSON.stringify(info.localeOverrides ?? {}, null, 2)}
          onChange={handleLocaleOverrides}
          rows={4}
        />
        {errors.localeOverrides && (
          <span className="text-sm text-red-600">
            {errors.localeOverrides.join("; ")}
          </span>
        )}
      </label>
    </>
  );
}
