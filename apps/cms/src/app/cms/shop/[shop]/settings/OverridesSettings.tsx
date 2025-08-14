// apps/cms/src/app/cms/shop/[shop]/settings/OverridesSettings.tsx
"use client";
import { Textarea } from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import type { Dispatch, SetStateAction } from "react";
import { jsonFieldHandler, ErrorSetter } from "../utils/formValidators";

interface Props {
  info: Shop;
  setInfo: Dispatch<SetStateAction<Shop>>;
  errors: Record<string, string[]>;
  setErrors: ErrorSetter;
}

export default function OverridesSettings({
  info,
  setInfo,
  errors,
  setErrors,
}: Props) {
  const handlePriceOverrides = jsonFieldHandler<Record<string, unknown>>(
    "priceOverrides",
    (parsed) => setInfo((prev) => ({ ...prev, priceOverrides: parsed })),
    setErrors,
  );

  const handleLocaleOverrides = jsonFieldHandler<Record<string, unknown>>(
    "localeOverrides",
    (parsed) => setInfo((prev) => ({ ...prev, localeOverrides: parsed })),
    setErrors,
  );

  return (
    <>
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
