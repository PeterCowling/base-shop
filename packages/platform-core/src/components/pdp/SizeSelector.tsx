// src/components/pdp/SizeSelector.tsx
"use client";

import { useState } from "react";

export default function SizeSelector({
  sizes,
  onSelect,
}: {
  sizes: string[];
  onSelect: (s: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleClick(size: string) {
    setSelected(size);
    onSelect(size);
  }

  // Tailwind utility class tokens
  const selectedClasses = "bg-foreground text-primary-fg"; // i18n-exempt -- ABC-123 CSS utility tokens
  const unselectedClasses = "bg-surface hover:bg-surface-2"; // i18n-exempt -- ABC-123 CSS utility tokens

  return (
    // eslint-disable-next-line ds/enforce-layout-primitives -- ABC-123 horizontal chip list
    <div className="inline-flex flex-wrap gap-2">
      {sizes.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => handleClick(s)}
          className={`px-3 py-1 border rounded-full text-sm min-h-10 min-w-10 ${
            selected === s ? selectedClasses : unselectedClasses
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
