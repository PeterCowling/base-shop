"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";
import { listLibrary, removeLibrary, clearLibrary, type LibraryItem } from "./libraryStore";
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

type PaletteRegistry = Record<string, BlockRegistryEntry<unknown> & { description?: string }>;

const createPaletteItems = (registry: PaletteRegistry): PaletteMeta[] =>
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
  layout: createPaletteItems(layoutRegistry as PaletteRegistry),
  containers: createPaletteItems(containerRegistry as PaletteRegistry),
  atoms: createPaletteItems(atomRegistry as PaletteRegistry),
  molecules: createPaletteItems(moleculeRegistry as PaletteRegistry),
  organisms: createPaletteItems(organismRegistry as PaletteRegistry),
  overlays: createPaletteItems(overlayRegistry as PaletteRegistry),
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
      <Image
        src={icon}
        alt=""
        aria-hidden="true"
        className="h-6 w-6 rounded"
        width={24}
        height={24}
        loading="lazy"
      />
      <span>{label}</span>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{content}</PopoverTrigger>
      <PopoverContent className="w-64 space-y-2 text-sm">
        <Image
          src={previewImage}
          alt=""
          className="w-full rounded"
          width={400}
          height={225}
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
  const pathname = usePathname() ?? "";
  const shop = getShopFromPath(pathname);
  const [library, setLibrary] = useState<LibraryItem[]>([]);

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

  useEffect(() => {
    // Load library
    setLibrary(listLibrary(shop));
  }, [shop]);

  useEffect(() => {
    const handler = () => setLibrary(listLibrary(shop));
    window.addEventListener("pb-library-changed", handler);
    return () => window.removeEventListener("pb-library-changed", handler);
  }, [shop]);

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
      {/* My Library */}
      {library.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold capitalize">My Library</h4>
            <button
              type="button"
              className="text-xs underline"
              onClick={() => {
                if (confirm("Clear all items from My Library?")) {
                  clearLibrary(shop);
                  setLibrary([]);
                }
              }}
            >
              Clear
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {library
              .filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
              .map((i) => (
                <LibraryPaletteItem key={i.id} item={i} onDelete={() => { removeLibrary(shop, i.id); setLibrary(listLibrary(shop)); }} />
              ))}
          </div>
        </div>
      )}

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

// Library item drag source (template)
function LibraryPaletteItem({ item, onDelete }: { item: LibraryItem; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: `lib-${item.id}`, data: { from: "library", template: item.template } });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-grabbed={isDragging}
      title="Drag to insert"
      style={{ transform: CSS.Transform.toString(transform) }}
      className="flex cursor-grab items-center gap-2 rounded border p-2 text-sm"
    >
      <Image
        src={"/window.svg"}
        alt=""
        aria-hidden="true"
        className="h-6 w-6 rounded"
        width={24}
        height={24}
        loading="lazy"
      />
      <span className="flex-1 truncate">{item.label}</span>
      <button
        type="button"
        aria-label="Delete from My Library"
        className="rounded border px-2 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        Delete
      </button>
    </div>
  );
}
