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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../atoms";

const defaultIcon = "/window.svg";

interface PaletteMeta {
  type: PageComponent["type"];
  label: string;
  icon: string;
  description?: string;
  previewImage?: string;
}

const createPaletteItems = (
  registry: Record<string, { description?: string; previewImage?: string }>,
): PaletteMeta[] =>
  (Object.keys(registry) as PageComponent["type"][])
    .sort()
    .map((t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
      icon: defaultIcon,
      description: registry[t]?.description,
      previewImage: registry[t]?.previewImage,
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
  description,
  previewImage,
}: PaletteMeta) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: type,
      data: { from: "palette", type },
    });
  const [open, setOpen] = useState(false);

  const content = (
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
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        className="h-4 w-4"
        loading="lazy"
      />
      <span>{label}</span>
    </div>
  );

  if (!description && !previewImage) return content;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{content}</PopoverTrigger>
      <PopoverContent className="w-64 space-y-2 text-sm">
        {previewImage && (
          <img
            src={previewImage}
            alt=""
            className="w-full rounded"
            loading="lazy"
          />
        )}
        {description && <p>{description}</p>}
      </PopoverContent>
    </Popover>
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
                  description={p.description}
                  previewImage={p.previewImage}
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
