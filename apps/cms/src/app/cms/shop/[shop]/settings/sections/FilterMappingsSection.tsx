"use client";

import type { MappingRow } from "@/hooks/useMappingRows";

import FilterMappings from "../FilterMappings";

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
    <div className="space-y-4">
      <FilterMappings
        mappings={mappings}
        addMapping={addMapping}
        updateMapping={updateMapping}
        removeMapping={removeMapping}
        errors={errors}
      />
    </div>
  );
}
