// src/components/shop/FilterBar.tsx
"use client";

import { useDeferredValue, useEffect, useState } from "react";

export type FilterDefinition =
  | { name: string; label: string; type: "select"; options: string[] }
  | { name: string; label: string; type: "number" };

export type Filters = Record<string, string | number | undefined>;

export interface FilterBarProps {
  definitions: FilterDefinition[];
  onChange: (filters: Filters) => void;
}

export default function FilterBar({
  definitions,
  onChange,
}: FilterBarProps) {
  const [values, setValues] = useState<Filters>({});
  const deferred = useDeferredValue(values);

  useEffect(() => {
    onChange(deferred);
  }, [deferred, onChange]);

  function handleChange(def: FilterDefinition, value: string) {
    setValues((prev) => ({
      ...prev,
      [def.name]:
        value === ""
          ? undefined
          : def.type === "number"
          ? Number(value)
          : value,
    }));
  }

  function handleClear() {
    setValues({});
  }

  return (
    <form
      aria-label="Filters"
      className="mb-6 flex gap-4 items-center justify-between flex-wrap"
      onSubmit={(e) => e.preventDefault()}
    >
      {definitions.map((def) =>
        def.type === "select" ? (
          <label key={def.name} className="flex items-center gap-2 text-sm">
            {def.label}:
            <select
              value={(values[def.name] as string) ?? ""}
              onChange={(e) => handleChange(def, e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All</option>
              {def.options.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </label>
        ) : (
          <label key={def.name} className="flex items-center gap-2 text-sm">
            {def.label}:
            <input
              type="number"
              value={
                values[def.name] === undefined
                  ? ""
                  : (values[def.name] as number)
              }
              onChange={(e) => handleChange(def, e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </label>
        )
      )}
      <button
        type="button"
        onClick={handleClear}
        className="text-sm underline"
      >
        Clear Filters
      </button>
    </form>
  );
}

