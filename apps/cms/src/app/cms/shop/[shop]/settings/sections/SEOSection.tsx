"use client";

import { Input } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";

interface SEOSectionProps {
  info: Shop;
  setInfo: Dispatch<SetStateAction<Shop>>;
  errors: Record<string, string[]>;
}

export default function SEOSection({ info, setInfo, errors }: SEOSectionProps) {
  const handleFilters = (event: ChangeEvent<HTMLInputElement>) => {
    setInfo((previous) => ({
      ...previous,
      catalogFilters: event.target.value.split(/,\s*/),
    }));
  };

  return (
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
  );
}
