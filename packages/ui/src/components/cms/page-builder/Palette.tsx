"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";
import { listLibrary, removeLibrary, updateLibrary, syncFromServer, saveLibrary, type LibraryItem } from "./libraryStore";
import { ulid } from "ulid";
import LibraryImportExport from "./LibraryImportExport";
import MediaLibrary from "./MediaLibrary";
import { isTopLevelAllowed } from "./rules";
import { palette } from "./paletteData";
import PaletteItem from "./PaletteItem";
import LibraryPaletteItem from "./LibraryPaletteItem";
import type { ComponentType } from "./defaults";
import type { PaletteProps } from "./palette.types";

const Palette = memo(function Palette({ onAdd, onInsertImage, onSetSectionBackground, selectedIsSection, defaultTab = "components" }: PaletteProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"components" | "media">(defaultTab);
  const [liveMessage, setLiveMessage] = useState("");
  const pathname = usePathname() ?? "";
  const shop = getShopFromPath(pathname);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recents, setRecents] = useState<string[]>(() => {
    try { const s = localStorage.getItem('pb:recent-types'); return s ? (JSON.parse(s) as string[]) : []; } catch { return []; }
  });

  const pushRecent = useCallback((type: ComponentType) => {
    try {
      setRecents((prev) => {
        const next = [type, ...prev.filter((t) => t !== type)].slice(0, 10);
        localStorage.setItem('pb:recent-types', JSON.stringify(next));
        return next;
      });
    } catch { /* noop */ }
  }, []);

  const handleAdd = useCallback(
    (type: ComponentType, label: string) => {
      onAdd(type);
      setLiveMessage(`${label} added`);
      pushRecent(type);
    },
    [onAdd, pushRecent],
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
      {/* Recents */}
      {recents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold capitalize">Recent</h4>
          </div>
          <div className="flex flex-col gap-2">
            {recents
              .map((type) => {
                // find meta from palette
                for (const [, items] of Object.entries(palette)) {
                  const match = items.find((p) => p.type === type);
                  if (match) return match;
                }
                return { type, label: type, icon: "/window.svg", description: "" } as any;
              })
              .filter((p) => isTopLevelAllowed(p.type as ComponentType))
              .map((p) => (
                <PaletteItem
                  key={`recent-${p.type}`}
                  type={p.type as ComponentType}
                  label={p.label}
                  icon={p.icon}
                  description={p.description}
                  previewImage={p.previewImage}
                  onAdd={handleAdd}
                />
              ))}
          </div>
        </div>
      )}

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
