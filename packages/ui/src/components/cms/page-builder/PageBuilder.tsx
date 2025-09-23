"use client";

import { locales } from "@acme/i18n/locales";
import { usePathname } from "next/navigation";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import { getShopFromPath } from "@acme/shared-utils";
import useFileDrop from "./hooks/useFileDrop";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePageBuilderDnD from "./hooks/usePageBuilderDnD";
import usePageBuilderControls from "./hooks/usePageBuilderControls";
import usePageBuilderSave from "./hooks/usePageBuilderSave";
import PageBuilderLayout from "./PageBuilderLayout";
import { defaults, CONTAINER_TYPES, type ComponentType } from "./defaults";
import usePreviewTokens from "./hooks/usePreviewTokens";
import useLayerSelectionPreference from "./hooks/useLayerSelectionPreference";
import useLocalStrings from "./hooks/useLocalStrings";
import useInsertHandlers from "./hooks/useInsertHandlers";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useGridSize from "./hooks/useGridSize";
import { buildCanvasProps, buildGridProps, buildHistoryProps, buildPreviewProps, buildToolbarProps, buildToastProps, buildTourProps } from "./buildProps";
import { listGlobals, updateGlobal, saveGlobal, type GlobalItem } from "./libraryStore";
import { ulid } from "ulid";

interface Props {
  page: Page; history?: HistoryState; onSave:(fd:FormData)=>Promise<unknown>; onPublish:(fd:FormData)=>Promise<unknown>;
  saving?: boolean; publishing?: boolean; saveError?: string | null; publishError?: string | null;
  onChange?: (components: PageComponent[]) => void; style?: CSSProperties;
  presetsSourceUrl?: string;
  pagesNav?: { items: { label: string; value: string; href: string }[]; current: string };
  mode?: "page" | "section";
}

const PageBuilder = memo(function PageBuilder({
  page,
  history: historyProp,
  onSave,
  onPublish,
  saving = false,
  publishing = false,
  saveError,
  publishError,
  onChange,
  style,
  presetsSourceUrl,
  pagesNav,
  mode = "page",
}: Props) {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);

  const saveRef = useRef<() => void>(() => {}),
    togglePreviewRef = useRef<() => void>(() => {}),
    rotateDeviceRef = useRef<(dir: "left" | "right") => void>(() => {});
  const { state, components, dispatch, selectedIds, setSelectedIds, liveMessage, clearHistory } = usePageBuilderState({
    page,
    history: historyProp,
    onChange,
    onSaveShortcut: () => saveRef.current(),
    onTogglePreview: () => togglePreviewRef.current(),
    onRotateDevice: (d) => rotateDeviceRef.current(d),
  });

  const controls = usePageBuilderControls({ state, dispatch });
  togglePreviewRef.current = controls.togglePreview;
  rotateDeviceRef.current = controls.rotateDevice;

  const { dragOver, setDragOver, handleFileDrop, progress, isValid } = useFileDrop({ shop: shop ?? "", dispatch });
  const canvasRef = useRef<HTMLDivElement>(null),
    scrollRef = useRef<HTMLDivElement>(null),
    [toast, setToast] = useState<{ open: boolean; message: string; retry?: () => void }>({ open: false, message: "" }),
    [snapPosition, setSnapPosition] = useState<number | null>(null);

  // Live theme tokens applied to the canvas container for instant visual feedback
  const previewTokens = usePreviewTokens();
  const [showComments, setShowComments] = useState(true);

  // Local strings helper for overlay/messages
  const t = useLocalStrings(controls.locale);

  const gridSize = useGridSize(canvasRef, { showGrid: controls.showGrid, gridCols: controls.gridCols, deviceKey: controls.deviceId + ":" + controls.orientation });

  const { dndContext, insertIndex, insertParentId, activeType, dropAllowed, dragMeta } = usePageBuilderDnD({
    components,
    dispatch,
    defaults: defaults as Record<string, Partial<PageComponent>>,
    containerTypes: CONTAINER_TYPES,
    selectId: (id: string) => setSelectedIds([id]),
    gridSize,
    canvasRef,
    setSnapPosition,
    editor: (state as any).editor,
    viewport: controls.viewport,
    scrollRef,
    zoom: controls.zoom,
    t,
  });
  const {
    selectedIsSection,
    handleAddFromPalette,
    handleInsertImageAsset,
    handleSetSectionBackground,
    handleInsertPreset,
    mediaLibraryListener,
  } = useInsertHandlers({ components, selectedIds, setSelectedIds, insertIndex, dispatch, t });

  // Support rich image insert via MediaLibrary (alt, cropAspect)
  useEffect(() => {
    window.addEventListener('pb:insert-image', mediaLibraryListener as EventListener);
    return () => window.removeEventListener('pb:insert-image', mediaLibraryListener as EventListener);
  }, [mediaLibraryListener]);

  // Keyboard shortcuts for save/publish/device/preview
  useKeyboardShortcuts({ onPublish: () => handlePublish(), rotateDevice: (d) => rotateDeviceRef.current(d), togglePreview: () => togglePreviewRef.current() });

  const { handlePublish, handleSave, autoSaveState } = usePageBuilderSave({
    page,
    components,
    state,
    onSave,
    onPublish,
    formDataDeps: [components, state],
    shop,
    onAutoSaveError: (retry) => {
      setToast({
        open: true,
        message: "Auto-save failed. Click to retry.",
        retry: () => {
          setToast((t) => ({ ...t, open: false }));
          retry();
        },
      });
    },
    clearHistory,
  });
  saveRef.current = handleSave;
  const toolbarProps = buildToolbarProps({
    deviceId: controls.deviceId,
    setDeviceId: controls.setDeviceId,
    orientation: controls.orientation,
    setOrientation: controls.setOrientation,
    locale: controls.locale,
    setLocale: controls.setLocale,
    locales,
    progress,
    isValid,
    zoom: controls.zoom,
    setZoom: controls.setZoom,
    // Page vs Global-section breakpoints
    breakpoints: (() => {
      const sel = selectedIds[0];
      if (!sel) return ((state as any).breakpoints ?? []) as any[];
      const flags = (state as any).editor?.[sel] ?? {};
      const isGlobal = !!flags?.global?.id;
      if (!isGlobal) return ((state as any).breakpoints ?? []);
      // prefer instance-level overrides; else fall back to library template breakpoints
      if (Array.isArray(flags.globalBreakpoints)) return flags.globalBreakpoints as any[];
      const gid = String(flags.global?.id || "");
      const gl = listGlobals(shop);
      const found = gl.find((g) => g.globalId === gid) as GlobalItem | undefined;
      return (found?.breakpoints ?? []) as any[];
    })(),
    setBreakpoints: (list: any[]) => {
      const sel = selectedIds[0];
      if (sel) {
        const flags = (state as any).editor?.[sel] ?? {};
        const isGlobal = !!flags?.global?.id;
        if (isGlobal) {
          // update instance override
          dispatch({ type: "update-editor", id: sel, patch: { globalBreakpoints: list } as any });
          // persist to global template to cascade to all instances
          try {
            const gid = String(flags.global?.id || "");
            if (gid) void updateGlobal(shop, gid, { breakpoints: list as any });
          } catch {}
          return;
        }
      }
      dispatch({ type: "set-breakpoints", breakpoints: list } as any);
    },
    extraDevices: (() => {
      const pageExtra = controls.extraDevices || [];
      const sel = selectedIds[0];
      if (!sel) return pageExtra;
      const flags = (state as any).editor?.[sel] ?? {};
      const isGlobal = !!flags?.global?.id;
      let g = isGlobal ? (flags.globalBreakpoints ?? []) as any[] : [];
      // fall back to library stored breakpoints when instance has none
      if (isGlobal && (!g || g.length === 0)) {
        try {
          const gid = String(flags.global?.id || "");
          const found = listGlobals(shop).find((i) => i.globalId === gid) as GlobalItem | undefined;
          g = (found?.breakpoints ?? []) as any[];
        } catch {}
      }
      if (!g.length) return pageExtra;
      const mapWidth = (bp: any): number => {
        const base = (typeof bp.max === 'number' && bp.max > 0) ? bp.max : (typeof bp.min === 'number' ? bp.min : 1024);
        return Math.max(320, Math.min(1920, base));
      };
      const toType = (w: number): "desktop" | "tablet" | "mobile" => (w >= 1024 ? "desktop" : w >= 768 ? "tablet" : "mobile");
      const devices = g.map((bp) => {
        const width = mapWidth(bp);
        const type = toType(width);
        const id = `global-bp-${bp.id}`;
        return { id, label: bp.label, width, height: 800, type, orientation: "portrait" } as any;
      });
      // de-duplicate by id
      const map = new Map<string, any>();
      [...pageExtra, ...devices].forEach((d: any) => { if (!map.has(d.id)) map.set(d.id, d); });
      return Array.from(map.values());
    })(),
    editingSizePx: (controls as any).editingSizePx ?? null,
    setEditingSizePx: (controls as any).setEditingSizePx,
    pagesNav,
  });

  const gridProps = buildGridProps({
    showGrid: controls.showGrid,
    toggleGrid: controls.toggleGrid,
    snapToGrid: controls.snapToGrid,
    toggleSnap: controls.toggleSnap,
    gridCols: controls.gridCols,
    setGridCols: controls.setGridCols,
    zoom: controls.zoom,
    setZoom: controls.setZoom,
    showRulers: controls.showRulers,
    toggleRulers: controls.toggleRulers,
    showBaseline: controls.showBaseline,
    toggleBaseline: controls.toggleBaseline,
    baselineStep: controls.baselineStep,
    setBaselineStep: controls.setBaselineStep,
  });

  const canvasProps = buildCanvasProps({
    components,
    selectedIds,
    onSelectIds: setSelectedIds,
    canvasRef,
    dragOver,
    setDragOver,
    onFileDrop: handleFileDrop,
    insertIndex,
    dispatch,
    locale: controls.locale,
    containerStyle: { width: "100%", ...(previewTokens as any) },
    showGrid: controls.showGrid,
    gridCols: controls.gridCols,
    snapEnabled: controls.snapToGrid,
    showRulers: controls.showRulers,
    viewport: controls.viewport,
    device: controls.device,
    snapPosition,
    editor: (state as any).editor,
    shop,
    pageId: page.id,
    showComments,
    zoom: controls.zoom,
    showBaseline: controls.showBaseline,
    baselineStep: controls.baselineStep,
  });

  const previewProps = buildPreviewProps({ components, locale: controls.locale, deviceId: controls.previewDeviceId, onChange: controls.setPreviewDeviceId, editor: (state as any).editor, extraDevices: controls.extraDevices });

  const historyProps = buildHistoryProps({
    canUndo: !!state.past.length,
    canRedo: !!state.future.length,
    onUndo: () => dispatch({ type: "undo" }),
    onRedo: () => dispatch({ type: "redo" }),
    onSave: handleSave,
    onPublish: handlePublish,
    saving,
    publishing,
    saveError,
    publishError,
    autoSaveState,
    shop,
    pageId: page.id,
    currentComponents: components,
    editor: (state as any).editor,
    onRestoreVersion: (restored: PageComponent[]) => {
      dispatch({ type: "set", components: restored });
      handleSave();
    },
  });

  const toastProps = buildToastProps({ open: toast.open, message: toast.message, retry: toast.retry, onClose: () => setToast((t) => ({ ...t, open: false })) });
  const tourProps = buildTourProps({ steps: controls.tourSteps, run: controls.runTour, callback: controls.handleTourCallback });
  const { parentFirst, setParentFirst } = useLayerSelectionPreference();

  // In section mode, auto-select the first Section so inserts go inside it.
  useEffect(() => {
    if (mode !== "section") return;
    const first = components.find((c: PageComponent) => c.type === "Section");
    if (first) setSelectedIds([first.id]);
  }, [mode, components, setSelectedIds]);

  return (
    <PageBuilderLayout
      style={style}
      paletteOnAdd={handleAddFromPalette}
      onInsertImageAsset={handleInsertImageAsset}
      onSetSectionBackground={handleSetSectionBackground}
      selectedIsSection={selectedIsSection}
      onInsertPreset={handleInsertPreset}
      mode={mode}
      onInsertLinkedSection={async (item) => {
        try {
          // Persist as Global (best-effort local + optional server)
          await saveGlobal(shop, { globalId: item.globalId, label: item.label, createdAt: Date.now(), template: item.component } as any);
        } catch {}
        // Insert node and mark as linked global
        const withNewIds = (node: PageComponent): PageComponent => {
          const cloned: any = { ...(node as any), id: ulid() };
          const kids = (node as any).children as PageComponent[] | undefined;
          if (Array.isArray(kids)) cloned.children = kids.map(withNewIds);
          return cloned as PageComponent;
        };
        const component = withNewIds(item.component);
        // Add at computed index after current selection
        const index = (() => {
          const list = components as PageComponent[];
          const sel = selectedIds[0];
          if (!sel) return list.length;
          const pos = list.findIndex((c) => c.id === sel);
          return pos >= 0 ? pos + 1 : list.length;
        })();
        dispatch({ type: "add", component, index });
        // Mark editor flags
        dispatch({ type: "update-editor", id: component.id, patch: { global: { id: item.globalId } } as any });
        setSelectedIds([component.id]);
      }}
      presetsSourceUrl={presetsSourceUrl ?? process.env.NEXT_PUBLIC_PAGEBUILDER_PRESETS_URL}
      toolbarProps={toolbarProps}
      gridProps={gridProps}
      startTour={controls.startTour}
      togglePreview={controls.togglePreview}
      showPreview={controls.showPreview}
      liveMessage={liveMessage}
      dndContext={dndContext}
      dropAllowed={dropAllowed}
      dragMeta={dragMeta as any}
      frameClass={controls.frameClass}
      viewport={controls.viewport}
      viewportStyle={controls.viewportStyle}
      zoom={controls.zoom}
      editingSizePx={(controls as any).editingSizePx ?? null}
      setEditingSizePx={(controls as any).setEditingSizePx}
      canvasProps={{ ...canvasProps, dropAllowed, insertParentId, preferParentOnClick: parentFirst }}
      scrollRef={scrollRef}
      activeType={activeType}
      previewProps={previewProps}
      historyProps={historyProps}
      sidebarProps={{ components, selectedIds, onSelectIds: setSelectedIds, dispatch, editor: (state as any).editor, viewport: controls.viewport, breakpoints: (state as any).breakpoints ?? [], pageId: page.id, crossNotices: (controls as any).crossBreakpointNotices }}
      toast={toastProps}
      tourProps={tourProps}
      showComments={showComments}
      toggleComments={() => setShowComments((v) => !v)}
      parentFirst={parentFirst}
      onParentFirstChange={setParentFirst}
      shop={shop}
      pageId={page.id}
      crossBreakpointNotices={(controls as any).crossBreakpointNotices}
      onCrossBreakpointNoticesChange={(controls as any).setCrossBreakpointNotices}
    />
  );
});

export default PageBuilder;
