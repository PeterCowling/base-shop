// apps/cms/src/app/cms/shop/[shop]/settings/FilterMappings.tsx
"use client";
import { Button, Input } from "@/components/atoms/shadcn";
import { ChangeEvent } from "react";

interface Row {
  key: string;
  value: string;
}

interface Props {
  mappings: Row[];
  addMapping: () => void;
  updateMapping: (index: number, field: "key" | "value", value: string) => void;
  removeMapping: (index: number) => void;
  errors: Record<string, string[]>;
}

export default function FilterMappings({
  mappings,
  addMapping,
  updateMapping,
  removeMapping,
  errors,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <span>Filter Mappings</span>
      {mappings.map((row, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            name="filterMappingsKey"
            value={row.key}
            placeholder="Filter"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateMapping(idx, "key", e.target.value)
            }
          />
          <Input
            name="filterMappingsValue"
            value={row.value}
            placeholder="Mapping"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateMapping(idx, "value", e.target.value)
            }
          />
          <Button type="button" onClick={() => removeMapping(idx)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" onClick={addMapping}>
        Add Mapping
      </Button>
      {errors.filterMappings && (
        <span className="text-sm text-red-600">
          {errors.filterMappings.join("; ")}
        </span>
      )}
    </div>
  );
}

