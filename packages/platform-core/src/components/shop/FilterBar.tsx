// src/components/shop/FilterBar.tsx
"use client";

import { useDeferredValue, useEffect, useState } from "react";

export type Filters = { size?: string };

export default function FilterBar({
  onChange,
}: {
  onChange: (f: Filters) => void;
}) {
  const [size, setSize] = useState("");
  const deferredSize = useDeferredValue(size);

  // propagate filters when typing settles
  useEffect(() => {
    onChange({ size: deferredSize || undefined } as Filters);
  }, [deferredSize, onChange]);

  return (
    <form
      aria-label="Filters"
      className="mb-6 flex gap-4 items-center justify-between flex-wrap"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="flex items-center gap-2 text-sm">
        Size:
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All</option>
          {["36", "37", "38", "39", "40", "41", "42", "43", "44"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
    </form>
  );
}
