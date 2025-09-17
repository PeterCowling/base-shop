"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import type { ChangeEvent } from "react";
import type { MappingRow } from "@/hooks/useMappingRows";

interface FilterMappingsSectionProps {
  mappings: MappingRow[];
  addMapping: () => void;
  updateMapping: (index: number, field: "key" | "value", value: string) => void;
  removeMapping: (index: number) => void;
  errors: Record<string, string[]>;
}

export default function FilterMappingsSection({
  mappings,
  addMapping,
  updateMapping,
  removeMapping,
  errors,
}: FilterMappingsSectionProps) {
  return (
    <div className="flex flex-col gap-1">
      <span>Filter Mappings</span>
      {mappings.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            name="filterMappingsKey"
            value={row.key}
            placeholder="Filter"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateMapping(index, "key", event.target.value)
            }
          />
          <Input
            name="filterMappingsValue"
            value={row.value}
            placeholder="Mapping"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              updateMapping(index, "value", event.target.value)
            }
          />
          <Button type="button" onClick={() => removeMapping(index)}>
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
