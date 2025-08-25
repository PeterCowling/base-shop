// apps/cms/src/app/cms/shop/[shop]/settings/LocaleOverrides.tsx
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

export default function LocaleOverrides({
  overrides,
  addOverride,
  updateOverride,
  removeOverride,
  errors,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span>Locale Overrides</span>
      {overrides.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            name="localeOverridesKey"
            value={row.key}
            placeholder="Field"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateOverride(idx, "key", e.target.value)
            }
          />
          <select
            name="localeOverridesValue"
            value={row.value}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              updateOverride(idx, "value", e.target.value)
            }
            className="border p-2"
          >
            <option value="">Select locale</option>
            <option value="en">en</option>
            <option value="de">de</option>
            <option value="it">it</option>
          </select>
          <Button type="button" onClick={() => removeOverride(idx)}>
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

