"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageComponent } from "@acme/types";
import { memo, useState } from "react";
import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
  overlayRegistry,
} from "../blocks";

const defaultIcon = "/window.svg";

const createPaletteItems = (registry: Record<string, unknown>) =>
  (Object.keys(registry) as PageComponent["type"][])
    .sort()
    .map((t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
      icon: defaultIcon,
    }));

const palette = {
  layout: createPaletteItems(layoutRegistry),
  containers: createPaletteItems(containerRegistry),
  atoms: createPaletteItems(atomRegistry),
  molecules: createPaletteItems(moleculeRegistry),
  organisms: createPaletteItems(organismRegistry),
  overlays: createPaletteItems(overlayRegistry),
} as const;

const PaletteItem = memo(function PaletteItem({
  type,
  label,
  icon,
}: {
  type: PageComponent["type"];
  label: string;
  icon: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: type,
      data: { from: "palette", type },
    });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      title="Drag or press space/enter to add"
      style={{ transform: CSS.Transform.toString(transform) }}
      className="flex cursor-grab items-center gap-2 rounded border p-2 text-sm"
    >
      <img src={icon} alt="" aria-hidden="true" className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
});
const Palette = memo(function Palette() {
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-4" data-tour="drag-component">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search components..."
        aria-label="Search components"
        className="rounded border p-2 text-sm"
      />
      {Object.entries(palette).map(([category, items]) => {
        const filtered = items.filter((p) =>
          p.label.toLowerCase().includes(search.toLowerCase()),
        );
        if (!filtered.length) return null;
        return (
          <div key={category} className="space-y-2">
            <h4 className="font-semibold capitalize">{category}</h4>
            <div className="flex flex-col gap-2">
              {filtered.map((p) => (
                <PaletteItem
                  key={p.type}
                  type={p.type}
                  label={p.label}
                  icon={p.icon}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default Palette;
