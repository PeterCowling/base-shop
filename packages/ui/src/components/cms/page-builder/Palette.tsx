"use client";

import { memo, useState, useCallback, useEffect, useRef, useMemo, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";
import { listLibrary, removeLibrary, updateLibrary, syncFromServer, saveLibrary, type LibraryItem } from "./libraryStore";
import { ulid } from "ulid";
import LibraryImportExport from "./LibraryImportExport";
import { isTopLevelAllowed } from "./rules";
import { defaultIcon, getPaletteCategories } from "./paletteData";
import PaletteItem from "./PaletteItem";
import LibraryPaletteItem from "./LibraryPaletteItem";
import type { ComponentType } from "./defaults";
import type { PaletteProps } from "./palette.types";
import type { PaletteMeta } from "./palette.types";
import { listInstalledApps, subscribeInstalledApps } from "./appInstallStore";
import usePreviewTokens from "./hooks/usePreviewTokens";
import { extractTextThemes, toCssValue, type TextTheme } from "./textThemes";
import PresetsModal from "./PresetsModal";

const Palette = memo(function Palette({ onAdd, onInsertImage, onSetSectionBackground, selectedIsSection, defaultTab = "components", onInsertPreset, mode = "all" }: PaletteProps) {
  const [search, setSearch] = useState("");
  const [liveMessage, setLiveMessage] = useState("");
  const [presetOpen, setPresetOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const shop = getShopFromPath(pathname);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recents, setRecents] = useState<string[]>(() => {
    try { const s = localStorage.getItem('pb:recent-types'); return s ? (JSON.parse(s) as string[]) : []; } catch { return []; }
  });
  const [installedApps, setInstalledApps] = useState<string[]>(() => listInstalledApps(shop ?? null));
  const previewTokens = usePreviewTokens();

  useEffect(() => {
    setInstalledApps(listInstalledApps(shop ?? null));
    return subscribeInstalledApps(shop ?? null, (apps) => setInstalledApps(apps));
  }, [shop]);

  const paletteCategories = useMemo(() => {
    const cats = getPaletteCategories(installedApps);
    if (mode === "all") return cats;
    const elementsSet = new Set(["atoms", "molecules", "overlays"]);
    const sectionsSet = new Set(["containers", "organisms"]);
    return cats.filter((c) => {
      // Base categories
      if (elementsSet.has(c.id)) return mode === "elements";
      if (sectionsSet.has(c.id)) return mode === "sections";
      // App-provided categories (dynamic) → treat as sections by default
      const isDynamic = !elementsSet.has(c.id) && !sectionsSet.has(c.id) && !["layout"].includes(c.id);
      if (isDynamic) return mode === "sections";
      // Exclude layout from both specialized modes
      return false;
    });
  }, [installedApps, mode]);

  const paletteIndex = useMemo(() => {
    const index = new Map<string, PaletteMeta>();
    for (const category of paletteCategories) {
      for (const item of category.items) {
        index.set(item.type, item);
      }
    }
    return index;
  }, [paletteCategories]);

  const textThemes = useMemo(() => extractTextThemes(previewTokens), [previewTokens]);

  const buildPreviewStyle = useCallback((theme: TextTheme): CSSProperties => {
    const base = theme.tokens.typography ?? {};
    const style: CSSProperties = {};
    if (base.fontFamily) style.fontFamily = toCssValue(base.fontFamily);
    if (base.fontSize) style.fontSize = toCssValue(base.fontSize);
    if (base.fontWeight) style.fontWeight = toCssValue(base.fontWeight);
    if (base.lineHeight) style.lineHeight = toCssValue(base.lineHeight);
    return style;
  }, []);

  const handleApplyTextTheme = useCallback((theme: TextTheme) => {
    try {
      window.dispatchEvent(new CustomEvent("pb:apply-text-theme", { detail: { id: theme.id } }));
      setLiveMessage(`${theme.label} text style applied`);
    } catch {
      // noop
    }
  }, []);

  const searchTerm = search.trim().toLowerCase();

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

  // Allow other parts of the UI (e.g. empty canvas overlay) to open presets
  useEffect(() => {
    const open = () => setPresetOpen(true);
    window.addEventListener("pb:open-presets", open as EventListener);
    return () => window.removeEventListener("pb:open-presets", open as EventListener);
  }, []);

  return (
    <div className="flex flex-col gap-4" data-tour="drag-component">
      {onInsertPreset && (
        <div>
          <PresetsModal onInsert={onInsertPreset} open={presetOpen} onOpenChange={setPresetOpen} hideTrigger />
        </div>
      )}
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
                const match = paletteIndex.get(type);
                if (match) return match;
                const label = type.replace(/([A-Z])/g, " $1").trim();
                return {
                  type: type as ComponentType,
                  label,
                  icon: defaultIcon,
                  description: "",
                  previewImage: defaultIcon,
                } satisfies PaletteMeta;
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

      {textThemes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold capitalize">Text Themes</h4>
            <span className="text-xs text-muted-foreground">Apply to selected block</span>
          </div>
          <div className="flex flex-col gap-2">
            {textThemes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className="flex flex-col gap-1 rounded border p-2 text-left text-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => handleApplyTextTheme(theme)}
              >
                <span className="font-medium">{theme.label}</span>
                <span aria-hidden="true" className="truncate" style={buildPreviewStyle(theme)}>
                  The quick brown fox jumps over the lazy dog
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {paletteCategories.map(({ id, label, items }) => {
        const filtered = items
          .filter((p) => p.label.toLowerCase().includes(searchTerm))
          // Only show items permitted at top-level (canvas)
          .filter((p) => isTopLevelAllowed(p.type));
        if (!filtered.length) return null;
        return (
          <div key={id} className="space-y-2">
            <h4 className="font-semibold capitalize">{label}</h4>
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
      </div>
    );
  });

export default Palette;
