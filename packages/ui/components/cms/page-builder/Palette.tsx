"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageComponent } from "@types";
import { memo } from "react";
import { atomRegistry, moleculeRegistry, organismRegistry } from "../blocks";

const palette = {
  atoms: (Object.keys(atomRegistry) as PageComponent["type"][]).map((t) => ({
    type: t,
    label: t.replace(/([A-Z])/g, " $1").trim(),
  })),
  molecules: (Object.keys(moleculeRegistry) as PageComponent["type"][]).map(
    (t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
    })
  ),
  organisms: (Object.keys(organismRegistry) as PageComponent["type"][]).map(
    (t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
    })
  ),
} as const;

const PaletteItem = memo(function PaletteItem({
  type,
}: {
  type: PageComponent["type"];
}) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id: type,
    data: { from: "palette", type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform) }}
      className="cursor-grab rounded border p-2 text-center text-sm"
    >
      {type}
    </div>
  );
});

const Palette = memo(function Palette() {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(palette).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h4 className="font-semibold capitalize">{category}</h4>
          <div className="flex flex-col gap-2">
            {items.map((p) => (
              <PaletteItem key={p.type} type={p.type} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

export default Palette;
