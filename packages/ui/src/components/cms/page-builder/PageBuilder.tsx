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

interface Props {
  page: Page; history?: HistoryState; onSave:(fd:FormData)=>Promise<unknown>; onPublish:(fd:FormData)=>Promise<unknown>;
  saving?: boolean; publishing?: boolean; saveError?: string | null; publishError?: string | null;
  onChange?: (components: PageComponent[]) => void; style?: CSSProperties;
  presetsSourceUrl?: string;
  pagesNav?: { items: { label: string; value: string; href: string }[]; current: string };
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
    breakpoints: (state as any).breakpoints ?? [],
    setBreakpoints: (list: any[]) => dispatch({ type: "set-breakpoints", breakpoints: list } as any),
    extraDevices: controls.extraDevices,
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

  return (
    <PageBuilderLayout
      style={style}
      paletteOnAdd={handleAddFromPalette}
      onInsertImageAsset={handleInsertImageAsset}
      onSetSectionBackground={handleSetSectionBackground}
      selectedIsSection={selectedIsSection}
      onInsertPreset={handleInsertPreset}
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
      canvasProps={{ ...canvasProps, dropAllowed, insertParentId, preferParentOnClick: parentFirst }}
      scrollRef={scrollRef}
      activeType={activeType}
      previewProps={previewProps}
      historyProps={historyProps}
      sidebarProps={{ components, selectedIds, onSelectIds: setSelectedIds, dispatch, editor: (state as any).editor, viewport: controls.viewport, breakpoints: (state as any).breakpoints ?? [], pageId: page.id }}
      toast={toastProps}
      tourProps={tourProps}
      showComments={showComments}
      toggleComments={() => setShowComments((v) => !v)}
      parentFirst={parentFirst}
      onParentFirstChange={setParentFirst}
      shop={shop}
      pageId={page.id}
    />
  );
});

export default PageBuilder;
