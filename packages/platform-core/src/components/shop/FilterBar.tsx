// src/components/shop/FilterBar.tsx
"use client";

import { useDeferredValue, useEffect, useState } from "react";

export type FilterDefinition =
  | { name: string; label: string; type: "select"; options: string[] }
  | { name: string; label: string; type: "number" };

export type Filters = Record<string, string | number | undefined>;

export interface FilterBarProps {
  definitions: FilterDefinition[];
  /**
   * Current values for the filters. When provided, the component becomes
   * controlled and will mirror any external updates. When omitted, an empty
   * object is assumed.
   */
  values?: Filters;
  onChange: (filters: Filters) => void;
}

export default function FilterBar({
  definitions,
  values: externalValues,
  onChange,
}: FilterBarProps) {
  const [values, setValues] = useState<Filters>(externalValues ?? {});
  const deferred = useDeferredValue(values);

  // Keep internal state in sync when parent updates its values (e.g. after a
  // reload where values are read from the URL).
  useEffect(() => {
    setValues(externalValues ?? {});
  }, [externalValues]);

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
              <option value="">All</option> {/* i18n-exempt -- ABC-123 select placeholder */}
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
        className="text-sm underline min-h-10 min-w-10"
      >
        {/* i18n-exempt -- ABC-123 control label */}
        Clear Filters
      </button>
    </form>
  );
}
