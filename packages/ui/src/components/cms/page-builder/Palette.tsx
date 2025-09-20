"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";
import { listLibrary, removeLibrary, clearLibrary, updateLibrary, syncFromServer, saveLibrary, type LibraryItem } from "./libraryStore";
import { ulid } from "ulid";
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
import LibraryImportExport from "./LibraryImportExport";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    // Load library (local snapshot) and then try sync from server
    setLibrary(listLibrary(shop));
    void syncFromServer(shop).then((remote) => {
      if (remote) setLibrary(remote);
    });
  }, [shop]);

  useEffect(() => {
    const handler = () => setLibrary(listLibrary(shop));
    window.addEventListener("pb-library-changed", handler);
    return () => window.removeEventListener("pb-library-changed", handler);
  }, [shop]);

  return (
    <div className="flex flex-col gap-4" data-tour="drag-component">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const text = await file.text();
            const parsed = JSON.parse(text) as unknown;
            const items: LibraryItem[] = Array.isArray(parsed)
              ? (parsed as LibraryItem[])
              : Array.isArray((parsed as any)?.items)
                ? ((parsed as any).items as LibraryItem[])
                : [];
            if (!items.length) throw new Error("Invalid file format");
            for (const item of items) {
              const clone = { ...item } as LibraryItem;
              clone.id = ulid();
              // Ignore import ownership; default to private on import
              delete (clone as any).ownerUserId;
              clone.shared = false;
              await saveLibrary(shop, clone);
            }
            await syncFromServer(shop);
            setLibrary(listLibrary(shop));
            setLiveMessage(`Imported ${items.length} item(s) into My Library`);
          } catch (err) {
            console.error("Library import failed", err);
            setLiveMessage("Import failed. Please check your file.");
          } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      />
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
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold capitalize">My Library</h4>
            <LibraryImportExport shop={shop} onAfterChange={() => setLibrary(listLibrary(shop))} />
          </div>
          <div className="flex flex-col gap-2">
            {library
              .filter((i) => {
                const q = search.trim().toLowerCase();
                if (!q) return true;
                const inLabel = i.label.toLowerCase().includes(q);
                const inTags = (i.tags || []).some((t) => t.toLowerCase().includes(q));
                return inLabel || inTags;
              })
              .map((i) => (
                <LibraryPaletteItem
                  key={i.id}
                  item={i}
                  onDelete={() => {
                    void removeLibrary(shop, i.id);
                    setLibrary(listLibrary(shop));
                  }}
                  onToggleShare={() => {
                    void updateLibrary(shop, i.id, { shared: !i.shared });
                    setLibrary(listLibrary(shop));
                  }}
                />
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
function LibraryPaletteItem({ item, onDelete, onToggleShare }: { item: LibraryItem; onDelete: () => void; onToggleShare: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: `lib-${item.id}`, data: { from: "library", template: item.template, templates: item.templates } });
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
      {item.thumbnail ? (
        <Image
          src={item.thumbnail}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 rounded object-cover"
          width={24}
          height={24}
          loading="lazy"
        />
      ) : (
        <Image
          src={"/window.svg"}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 rounded"
          width={24}
          height={24}
          loading="lazy"
        />
      )}
      <span className="flex-1 truncate" title={item.label}>{item.label}</span>
      {Array.isArray(item.tags) && item.tags.length > 0 && (
        <span className="hidden md:block text-xs text-muted-foreground truncate max-w-[10rem]" title={item.tags.join(", ")}>
          {item.tags.join(", ")}
        </span>
      )}
      <button
        type="button"
        aria-label={item.shared ? "Unshare" : "Share"}
        className={`rounded border px-2 text-xs ${item.shared ? "bg-green-50" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleShare();
        }}
        title={item.shared ? "Shared with team" : "Private"}
      >
        {item.shared ? "Shared" : "Private"}
      </button>
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
