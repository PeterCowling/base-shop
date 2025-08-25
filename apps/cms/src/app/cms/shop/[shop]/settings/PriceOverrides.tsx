// apps/cms/src/app/cms/shop/[shop]/settings/PriceOverrides.tsx
"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { ChangeEvent } from "react";

interface Row {
  key: string;
  value: string;
}

interface Props {
  overrides: Row[];
  addOverride: () => void;
  updateOverride: (index: number, field: "key" | "value", value: string) => void;
  removeOverride: (index: number) => void;
  errors: Record<string, string[]>;
}

export default function PriceOverrides({
  overrides,
  addOverride,
  updateOverride,
  removeOverride,
  errors,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span>Price Overrides</span>
      {overrides.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            name="priceOverridesKey"
            value={row.key}
            placeholder="Locale"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateOverride(idx, "key", e.target.value)
            }
          />
          <Input
            type="number"
            name="priceOverridesValue"
            value={row.value}
            placeholder="Price"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateOverride(idx, "value", e.target.value)
            }
          />
          <Button type="button" onClick={() => removeOverride(idx)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={addOverride}>
        Add Override
      </Button>
      {errors.priceOverrides && (
        <span className="text-sm text-red-600">
          {errors.priceOverrides.join("; ")}
        </span>
      )}
    </div>
  );
}

