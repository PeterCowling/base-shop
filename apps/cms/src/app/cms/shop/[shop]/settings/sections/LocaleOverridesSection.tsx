"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import type { ChangeEvent } from "react";
import type { MappingRow } from "@/hooks/useMappingRows";

interface LocaleOverridesSectionProps {
  overrides: MappingRow[];
  addOverride: () => void;
  updateOverride: (index: number, field: "key" | "value", value: string) => void;
  removeOverride: (index: number) => void;
  errors: Record<string, string[]>;
}

export default function LocaleOverridesSection({
  overrides,
  addOverride,
  updateOverride,
  removeOverride,
  errors,
}: LocaleOverridesSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <span>Locale Overrides</span>
      {overrides.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            name="localeOverridesKey"
            value={row.key}
            placeholder="Field"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateOverride(index, "key", event.target.value)
            }
          />
          <select
            name="localeOverridesValue"
            value={row.value}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              updateOverride(index, "value", event.target.value)
            }
            className="border p-2"
          >
            <option value="">Select locale</option>
            <option value="en">en</option>
            <option value="de">de</option>
            <option value="it">it</option>
          </select>
          <Button type="button" onClick={() => removeOverride(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={addOverride}>
        Add Override
      </Button>
      {errors.localeOverrides && (
        <span className="text-sm text-red-600">
          {errors.localeOverrides.join("; ")}
        </span>
      )}
    </div>
  );
}
