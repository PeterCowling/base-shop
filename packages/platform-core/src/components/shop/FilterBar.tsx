// src/components/shop/FilterBar.tsx
"use client";

import { useDeferredValue, useEffect, useState } from "react";

export type Filters = { size?: string };

const defaultSizes = ["36", "37", "38", "39", "40", "41", "42", "43", "44"];

export default function FilterBar({
  onChange,
  sizes = defaultSizes,
}: {
  onChange: (f: Filters) => void;
  sizes?: string[];
}) {
  const [size, setSize] = useState("");
  const deferredSize = useDeferredValue(size);

  // propagate filters when typing settles
  useEffect(() => {
    onChange({ size: deferredSize || undefined } as Filters);
  }, [deferredSize, onChange]);

  function clearFilters() {
    setSize("");
    onChange({} as Filters);
  }

  return (
    <form
      aria-label="Filters"
      className="mb-6 flex flex-wrap items-center justify-between gap-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="flex items-center gap-2 text-sm">
        Size:
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        >
          <option value="">All</option>
          {sizes.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={clearFilters}
        className="rounded border px-2 py-1 text-sm"
      >
        Clear Filters
      </button>
    </form>
  );
}
