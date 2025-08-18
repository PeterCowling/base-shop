"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useState, useCallback, useEffect } from "react";
import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
  overlayRegistry,
} from "../blocks";
import type { BlockRegistryEntry } from "../blocks/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../atoms";
import type { ComponentType } from "./defaults";

const defaultIcon = "/window.svg";

interface PaletteMeta {
  type: ComponentType;
  label: string;
  icon: string;
  description?: string;
  previewImage: string;
}

const createPaletteItems = (
  registry: Record<string, BlockRegistryEntry<any> & { description?: string }>,
): PaletteMeta[] =>
  (Object.keys(registry) as ComponentType[])
    .sort()
    .map((t) => ({
      type: t,
      label: t.replace(/([A-Z])/g, " $1").trim(),
      icon: registry[t]?.previewImage ?? defaultIcon,
      description: registry[t]?.description,
      previewImage: registry[t]?.previewImage ?? defaultIcon,
    }));

const palette = {
  layout: createPaletteItems(layoutRegistry),
  containers: createPaletteItems(containerRegistry),
  atoms: createPaletteItems(atomRegistry),
  molecules: createPaletteItems(moleculeRegistry),
  organisms: createPaletteItems(organismRegistry),
  overlays: createPaletteItems(overlayRegistry),
} as const;

interface PaletteItemProps extends PaletteMeta {
  onAdd: (type: ComponentType, label: string) => void;
}

const PaletteItem = memo(function PaletteItem({
  type,
  label,
  icon,
  description,
  previewImage,
  onAdd,
}: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: type,
      data: { from: "palette", type },
    });
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onAdd(type, label);
      }
    },
    [onAdd, type, label],
  );

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
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onKeyDown={handleKeyDown}
    >
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        className="h-6 w-6 rounded"
        loading="lazy"
      />
      <span>{label}</span>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{content}</PopoverTrigger>
      <PopoverContent className="w-64 space-y-2 text-sm">
        <img
          src={previewImage}
          alt=""
          className="w-full rounded"
          loading="lazy"
        />
        {description && <p>{description}</p>}
      </PopoverContent>
    </Popover>
  );
});

interface PaletteProps {
  onAdd: (type: ComponentType) => void;
}

const Palette = memo(function Palette({ onAdd }: PaletteProps) {
  const [search, setSearch] = useState("");
  const [liveMessage, setLiveMessage] = useState("");

  const handleAdd = useCallback(
    (type: ComponentType, label: string) => {
      onAdd(type);
      setLiveMessage(`${label} added`);
    },
    [onAdd],
  );

  useEffect(() => {
    if (!liveMessage) return;
    const t = setTimeout(() => setLiveMessage(""), 500);
    return () => clearTimeout(t);
  }, [liveMessage]);

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
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
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
                  onAdd={handleAdd}
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
