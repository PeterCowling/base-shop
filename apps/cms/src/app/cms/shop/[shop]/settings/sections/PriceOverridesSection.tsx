"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import type { ChangeEvent } from "react";
import type { MappingRow } from "@/hooks/useMappingRows";

interface PriceOverridesSectionProps {
  overrides: MappingRow[];
  addOverride: () => void;
  updateOverride: (index: number, field: "key" | "value", value: string) => void;
  removeOverride: (index: number) => void;
  errors: Record<string, string[]>;
}

export default function PriceOverridesSection({
  overrides,
  addOverride,
  updateOverride,
  removeOverride,
  errors,
}: PriceOverridesSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <span>Price Overrides</span>
      {overrides.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            name="priceOverridesKey"
            value={row.key}
            placeholder="Locale"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateOverride(index, "key", event.target.value)
            }
          />
          <Input
            type="number"
            name="priceOverridesValue"
            value={row.value}
            placeholder="Price"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateOverride(index, "value", event.target.value)
            }
          />
          <Button type="button" onClick={() => removeOverride(index)}>
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
