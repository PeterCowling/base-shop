"use client";

import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import type { MappingRow } from "@/hooks/useMappingRows";
import type { ChangeEvent } from "react";

interface ShopOverridesSectionProps {
  overrides: MappingRow[];
  onAddOverride: () => void;
  onUpdateOverride: (index: number, field: "key" | "value", value: string) => void;
  onRemoveOverride: (index: number) => void;
  errors: Record<string, string[]>;
}

export default function ShopOverridesSection({
  overrides,
  onAddOverride,
  onUpdateOverride,
  onRemoveOverride,
  errors,
}: ShopOverridesSectionProps) {
  const handleOverrideChange = (
    index: number,
    field: "key" | "value",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    onUpdateOverride(index, field, event.target.value);
  };

  return (
    <Card className="col-span-full">
      <CardContent className="space-y-3 p-6">
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Price overrides</h2>
          <div className="space-y-2">
            {overrides.map((row, index) => (
              <div key={`${row.key}-${index}`} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  name="priceOverridesKey"
                  value={row.key}
                  placeholder="Locale"
                  onChange={(event) => handleOverrideChange(index, "key", event)}
                />
                <Input
                  type="number"
                  name="priceOverridesValue"
                  value={row.value}
                  placeholder="Price"
                  onChange={(event) => handleOverrideChange(index, "value", event)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onRemoveOverride(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" onClick={onAddOverride}>
            Add Override
          </Button>
          {errors.priceOverrides && (
            <span className="text-sm text-red-600">
              {errors.priceOverrides.join("; ")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
