// apps/cms/src/app/cms/shop/[shop]/settings/SEOSettings.tsx
"use client";
import { Input } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";

interface Props {
  info: Shop;
  setInfo: Dispatch<SetStateAction<Shop>>;
  errors: Record<string, string[]>;
}

export default function SEOSettings({ info, setInfo, errors }: Props) {
  const handleFilters = (e: ChangeEvent<HTMLInputElement>) => {
    setInfo((prev) => ({
      ...prev,
      catalogFilters: e.target.value.split(/,\s*/),
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
