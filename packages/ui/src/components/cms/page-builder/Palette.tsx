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
  Tooltip,
} from "../../atoms";
import type { ComponentType } from "./defaults";
import LibraryImportExport from "./LibraryImportExport";
import MediaLibrary from "./MediaLibrary";
import { isTopLevelAllowed } from "./rules";

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
      <PopoverTrigger asChild>
        <Tooltip text={description ? `${label} — ${description}` : label}>
          {content}
        </Tooltip>
      </PopoverTrigger>
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
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection?: boolean;
  defaultTab?: "components" | "media";
}

const Palette = memo(function Palette({ onAdd, onInsertImage, onSetSectionBackground, selectedIsSection, defaultTab = "components" }: PaletteProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"components" | "media">(defaultTab);
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
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={`rounded border px-2 py-1 text-sm ${tab === 'components' ? 'bg-muted' : ''}`} onClick={() => setTab('components')}>
          Components
        </button>
        <button type="button" className={`rounded border px-2 py-1 text-sm ${tab === 'media' ? 'bg-muted' : ''}`} onClick={() => setTab('media')}>
          Media
        </button>
      </div>
      {tab === 'media' ? (
        <div>
          {/* Media Library */}
          <MediaLibrary onInsertImage={onInsertImage} onSetSectionBackground={onSetSectionBackground} selectedIsSection={selectedIsSection} />
        </div>
      ) : (
      <>
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
                  onUpdate={(patch) => {
                    void updateLibrary(shop, i.id, patch);
                    setLibrary(listLibrary(shop));
                  }}
                  shop={shop}
                />
              ))}
          </div>
        </div>
      )}

      {Object.entries(palette).map(([category, items]) => {
        const filtered = items
          .filter((p) => p.label.toLowerCase().includes(search.toLowerCase()))
          // Only show items permitted at top-level (canvas)
          .filter((p) => isTopLevelAllowed(p.type));
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
      </>
      )}
      </div>
    );
  });

export default Palette;

// Library item drag source (template)
function LibraryPaletteItem({ item, onDelete, onToggleShare, onUpdate, shop }: { item: LibraryItem; onDelete: () => void; onToggleShare: () => void; onUpdate: (patch: Partial<Pick<LibraryItem, "label" | "tags" | "thumbnail">>) => void; shop?: string | null }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: `lib-${item.id}`, data: { from: "library", template: item.template, templates: item.templates } });
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(Array.isArray(item.tags) ? item.tags : []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput("");
  }, [tagInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  const handleThumbFile = useCallback(async (f: File | null | undefined) => {
    if (!f) return;
    try {
      if (shop) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch(`/api/media?shop=${encodeURIComponent(shop)}&orientation=landscape`, { method: "POST", body: fd });
        if (res.ok) {
          const media = await res.json();
          const url = (media && (media.url || media.fileUrl || media.path)) as string | undefined;
          if (url) {
            onUpdate({ thumbnail: url });
            return;
          }
        }
      }
      // Fallback to data URL
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("read error"));
        reader.onload = () => {
          onUpdate({ thumbnail: String(reader.result) });
          resolve();
        };
        reader.readAsDataURL(f);
      });
    } catch {
      // ignore
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUpdate, shop]);
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
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input className="min-w-0 flex-1 rounded border px-2 py-1 text-xs" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px]">
                  {t}
                  <button type="button" aria-label={`Remove ${t}`} className="rounded border px-1" onClick={(e) => { e.stopPropagation(); setTags((prev) => prev.filter((x) => x !== t)); }}>×</button>
                </span>
              ))}
              <input
                className="min-w-[6rem] flex-1 rounded border px-2 py-1 text-xs"
                placeholder="add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Add tag"
              />
              <button type="button" className="rounded border px-2 text-xs" onClick={(e) => { e.stopPropagation(); addTag(); }}>Add</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <span className="flex-1 truncate" title={item.label}>{item.label}</span>
          {Array.isArray(item.tags) && item.tags.length > 0 && (
            <span className="hidden md:block text-xs text-muted-foreground truncate max-w-[10rem]" title={item.tags.join(", ")}>
              {item.tags.join(", ")}
            </span>
          )}
        </>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleThumbFile(e.target.files?.[0])} />
      <Tooltip text="Upload thumbnail">
        <button
          type="button"
          aria-label="Upload thumbnail"
          className="rounded border px-2 text-xs"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          title="Upload thumbnail"
        >
          Thumb
        </button>
      </Tooltip>
      {item.thumbnail && (
        <Tooltip text="Clear thumbnail">
          <button
            type="button"
            aria-label="Clear thumbnail"
            className="rounded border px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); onUpdate({ thumbnail: null }); }}
          >
            Clear
          </button>
        </Tooltip>
      )}
      {editing ? (
        <>
          <Tooltip text="Save changes">
            <button
              type="button"
              aria-label="Save"
              className="rounded border px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                const nextTags = tags.map((t) => t.trim()).filter(Boolean);
                onUpdate({ label: label.trim() || item.label, tags: nextTags });
                setEditing(false);
              }}
            >
              Save
            </button>
          </Tooltip>
          <Tooltip text="Cancel editing">
            <button
              type="button"
              aria-label="Cancel"
              className="rounded border px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setLabel(item.label);
                setTags(Array.isArray(item.tags) ? item.tags : []);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </Tooltip>
        </>
      ) : (
        <Tooltip text="Edit item">
          <button
            type="button"
            aria-label="Edit"
            className="rounded border px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            Edit
          </button>
        </Tooltip>
      )}
      <Tooltip text={item.shared ? "Unshare with team" : "Share with team"}>
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
      </Tooltip>
      <Tooltip text="Delete from My Library">
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
      </Tooltip>
    </div>
  );
}
