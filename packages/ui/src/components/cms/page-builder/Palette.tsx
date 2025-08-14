"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageComponent } from "@acme/types";
import { memo, useState, type ElementType } from "react";
import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
  overlayRegistry,
} from "../blocks";

import {
  Component1Icon,
  ContainerIcon,
  DotFilledIcon,
  LayersIcon,
  RowsIcon,
  TransparencyGridIcon,
} from "@radix-ui/react-icons";

type PaletteEntry = {
  type: PageComponent["type"];
  label: string;
  Icon: ElementType;
};

function buildPalette(
  registry: Record<string, unknown>,
  Icon: PaletteEntry["Icon"]
): PaletteEntry[] {
  return (Object.keys(registry) as PageComponent["type"][]).sort().map((t) => ({
    type: t,
    label: t.replace(/([A-Z])/g, " $1").trim(),
    Icon,
  }));
}

const palette = {
  layout: buildPalette(layoutRegistry, RowsIcon),
  containers: buildPalette(containerRegistry, ContainerIcon),
  atoms: buildPalette(atomRegistry, DotFilledIcon),
  molecules: buildPalette(moleculeRegistry, Component1Icon),
  organisms: buildPalette(organismRegistry, LayersIcon),
  overlays: buildPalette(overlayRegistry, TransparencyGridIcon),
} as const;

const PaletteItem = memo(function PaletteItem({
  type,
  label,
  Icon,
}: {
  type: PageComponent["type"];
  label: string;
  Icon: PaletteEntry["Icon"];
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
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
});

const Palette = memo(function Palette() {
  const [search, setSearch] = useState("");
  const query = search.toLowerCase();

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search components..."
        className="rounded border p-2 text-sm"
      />
      {Object.entries(palette).map(([category, items]) => {
        const filtered = items.filter((p) =>
          p.label.toLowerCase().includes(query)
        );
        if (filtered.length === 0) return null;
        return (
          <div key={category} className="space-y-2">
            <h4 className="font-semibold capitalize">{category}</h4>
            <div className="flex flex-col gap-2">
              {filtered.map((p) => (
                <PaletteItem
                  key={p.type}
                  type={p.type}
                  label={p.label}
                  Icon={p.Icon}
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
