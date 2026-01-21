"use client";

import { memo, useCallback, useEffect, useMemo,useState } from "react";
import { usePathname } from "next/navigation";

import { useTranslations } from "@acme/i18n";
import { getShopFromPath } from "@acme/lib/shop";

import type { ComponentType } from "./defaults";
import useInstalledApps from "./hooks/useInstalledApps";
import useLibraries from "./hooks/useLibraries";
import useLiveMessage from "./hooks/useLiveMessage";
import usePaletteCategories, { type PaletteMode } from "./hooks/usePaletteCategories";
import usePaletteIndex from "./hooks/usePaletteIndex";
import useRecents from "./hooks/useRecents";
import useTextThemesPreview from "./hooks/useTextThemesPreview";
import LibraryImportExport from "./LibraryImportExport";
import type { PaletteProps } from "./palette.types";
import CategoriesList from "./palette/CategoriesList";
import LibraryList from "./palette/LibraryList";
import RecentsList from "./palette/RecentsList";
import SearchInput from "./palette/SearchInput";
import TextThemesList from "./palette/TextThemesList";
import PresetsModal from "./PresetsModal";

const Palette = memo(function Palette({
  onAdd,
  onInsertImage: _onInsertImage,
  onSetSectionBackground: _onSetSectionBackground,
  selectedIsSection: _selectedIsSection,
  defaultTab: _defaultTab = "components",
  onInsertPreset,
  mode = "all",
  allowedTypes,
}: PaletteProps) {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [presetOpen, setPresetOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const shop = getShopFromPath(pathname);
  const { liveMessage, setLiveMessage } = useLiveMessage();
  const { recents, pushRecent } = useRecents();
  const installedApps = useInstalledApps(shop);
  const paletteCategories = usePaletteCategories(installedApps, mode as PaletteMode);
  const filteredCategories = useMemo(() => {
    if (!allowedTypes) return paletteCategories;
    return paletteCategories
      .map((c) => ({
        ...c,
        items: c.items.filter((item) => allowedTypes.has(item.type)),
      }))
      .filter((c) => c.items.length > 0);
  }, [allowedTypes, paletteCategories]);
  const paletteIndex = usePaletteIndex(filteredCategories);
  const { textThemes, buildPreviewStyle } = useTextThemesPreview();
  const { library, setLibrary, globalLibrary, setGlobalLibrary, removeLibrary, updateLibrary } = useLibraries(shop);

  // Allow other parts of the UI (e.g. empty canvas overlay) to open presets
  // Kept local to maintain behavior while simplifying responsibilities
  useEffect(() => {
    const open = () => setPresetOpen(true);
    window.addEventListener("pb:open-presets", open as EventListener);
    return () => window.removeEventListener("pb:open-presets", open as EventListener);
  }, []);

  const searchTerm = search.trim().toLowerCase();

  const handleApplyTextTheme = useCallback((theme: { id: string; label: string }) => {
    try {
      window.dispatchEvent(new CustomEvent("pb:apply-text-theme", { detail: { id: theme.id } }));
      setLiveMessage(`${theme.label} text style applied`);
    } catch {
      // noop
    }
  }, [setLiveMessage]);

  const handleAdd = useCallback(
    (type: ComponentType, label: string) => {
      onAdd(type);
      setLiveMessage(`${label} added`);
      pushRecent(type);
    },
    [onAdd, pushRecent, setLiveMessage],
  );

  return (
    // i18n-exempt — non-user-facing data attribute for product tour
    <div className="flex flex-col gap-4" data-tour="drag-component"> {/* i18n-exempt -- DS-1023 data attribute, not user-facing [ttl=2026-12-31] */}
      {onInsertPreset && (
        <div>
          <PresetsModal onInsert={onInsertPreset} open={presetOpen} onOpenChange={setPresetOpen} />
        </div>
      )}

      <SearchInput value={search} onChange={setSearch} />

      <div aria-live="polite" className="sr-only">{liveMessage}</div>

      <RecentsList recents={recents} paletteIndex={paletteIndex} onAdd={handleAdd} />

      <LibraryList
        title={t("Global Library")}
        items={globalLibrary}
        scope="_global"
        search={search}
        onDelete={(id) => { void removeLibrary("_global", id); setGlobalLibrary((prev) => prev.filter((x) => x.id !== id)); }}
        onToggleShare={(id, shared) => { void updateLibrary("_global", id, { shared }); setGlobalLibrary((prev) => prev.map((x) => (x.id === id ? { ...x, shared } : x))); }}
        onUpdate={(id, patch) => { void updateLibrary("_global", id, patch); setGlobalLibrary((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))); }}
      />

      <LibraryList
        title={t("My Library")}
        items={library}
        scope={shop}
        search={search}
        onDelete={(id) => { void removeLibrary(shop, id); setLibrary((prev) => prev.filter((x) => x.id !== id)); }}
        onToggleShare={(id, shared) => { void updateLibrary(shop, id, { shared }); setLibrary((prev) => prev.map((x) => (x.id === id ? { ...x, shared } : x))); }}
        onUpdate={(id, patch) => { void updateLibrary(shop, id, patch); setLibrary((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))); }}
        shop={shop}
        headerRight={<LibraryImportExport shop={shop} onAfterChange={() => undefined} />}
      />

      <TextThemesList textThemes={textThemes} buildPreviewStyle={buildPreviewStyle} onApply={handleApplyTextTheme} />

      <CategoriesList categories={filteredCategories} searchTerm={searchTerm} onAdd={handleAdd} />
    </div>
  );
});

export default Palette;
