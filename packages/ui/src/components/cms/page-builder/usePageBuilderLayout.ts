"use client";

import { locales } from "@acme/i18n/locales";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getShopFromPath } from "@acme/shared-utils";
import useFileDrop from "./hooks/useFileDrop";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePageBuilderDnD from "./hooks/usePageBuilderDnD";
import usePageBuilderControls from "./hooks/usePageBuilderControls";
import usePageBuilderSave from "./hooks/usePageBuilderSave";
import usePreviewTokens from "./hooks/usePreviewTokens";
import useLayerSelectionPreference from "./hooks/useLayerSelectionPreference";
import useLocalStrings from "./hooks/useLocalStrings";
import useInsertHandlers from "./hooks/useInsertHandlers";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import useGridSize from "./hooks/useGridSize";
import { defaults, CONTAINER_TYPES } from "./defaults";
import { buildCanvasProps, buildGridProps, buildHistoryProps, buildPreviewProps, buildTourProps } from "./buildProps";
import { createToolbarProps } from "./createToolbarProps";
import { createLinkedSectionHandler } from "./createLinkedSectionHandler";
import useMediaLibraryListener from "./useMediaLibraryListener";
import useSectionModeInitialSelection from "./useSectionModeInitialSelection";
import type { PageComponent, HistoryState } from "@acme/types";
import type { PageBuilderLayoutProps, PageBuilderProps } from "./PageBuilder.types";
import usePublishWithValidation from "./hooks/usePublishWithValidation";
import usePresetActions from "./hooks/usePresetActions";
import { useToastState } from "./hooks/useToastState";

const usePageBuilderLayout = ({
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
}: PageBuilderProps): PageBuilderLayoutProps => {
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);

  const saveRef = useRef<() => void>(() => {});
  const togglePreviewRef = useRef<() => void>(() => {});
  const rotateDeviceRef = useRef<(direction: "left" | "right") => void>(() => {});

  const {
    state,
    components,
    dispatch,
    selectedIds,
    setSelectedIds,
    liveMessage,
    clearHistory,
  } = usePageBuilderState({
    page,
    history: historyProp,
    onChange,
    onSaveShortcut: () => saveRef.current(),
    onTogglePreview: () => togglePreviewRef.current(),
    onRotateDevice: (direction) => rotateDeviceRef.current(direction),
  });

  const controls = usePageBuilderControls({ state, dispatch });
  togglePreviewRef.current = controls.togglePreview;
  rotateDeviceRef.current = controls.rotateDevice;

  const { dragOver, setDragOver, handleFileDrop, progress, isValid } = useFileDrop({
    shop: shop ?? "",
    dispatch,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setToast, toastProps } = useToastState();
  const [snapPosition, setSnapPosition] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(true);

  const previewTokens = usePreviewTokens();
  const t = useLocalStrings(controls.locale);
  const gridSize = useGridSize(canvasRef, {
    showGrid: controls.showGrid,
    gridCols: controls.gridCols,
    deviceKey: `${controls.deviceId}:${controls.orientation}`,
  });

  const {
    dndContext,
    insertIndex,
    insertParentId,
    activeType,
    dropAllowed,
    dragMeta,
  } = usePageBuilderDnD({
    components,
    dispatch,
    defaults: defaults as Record<string, Partial<PageComponent>>,
    containerTypes: CONTAINER_TYPES,
    selectId: (id: string) => setSelectedIds([id]),
    gridSize,
    canvasRef,
    setSnapPosition,
    editor: (state as { editor?: HistoryState["editor"] }).editor,
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
  } = useInsertHandlers({
    components,
    selectedIds,
    setSelectedIds,
    insertIndex,
    insertParentId,
    dispatch,
    t,
  });

  useMediaLibraryListener(mediaLibraryListener);

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
        message: t("Auto-save failed. Click to retry."),
        retry: () => {
          setToast((current) => ({ ...current, open: false }));
          retry();
        },
      });
    },
    clearHistory,
  });

  saveRef.current = handleSave;

  const publishWithValidation = usePublishWithValidation({
    components,
    handlePublish,
    setToast,
  });

  useKeyboardShortcuts({
    onPublish: () => publishWithValidation(),
    rotateDevice: (direction) => rotateDeviceRef.current(direction),
    togglePreview: () => togglePreviewRef.current(),
  });

  const toolbarProps = createToolbarProps({
    controls,
    selectedIds,
    state,
    dispatch,
    shop,
    progress,
    isValid,
    locales,
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
    containerStyle: { width: "100%", ...(previewTokens as unknown as CSSProperties) },
    showGrid: controls.showGrid,
    gridCols: controls.gridCols,
    snapEnabled: controls.snapToGrid,
    showRulers: controls.showRulers,
    viewport: controls.viewport,
    device: controls.device,
    snapPosition,
    editor: (state as { editor?: HistoryState["editor"] }).editor,
    shop,
    pageId: page.id,
    showComments,
    zoom: controls.zoom,
    showBaseline: controls.showBaseline,
    baselineStep: controls.baselineStep,
  });

  const previewProps = buildPreviewProps({
    components,
    locale: controls.locale,
    deviceId: controls.previewDeviceId,
    onChange: controls.setPreviewDeviceId,
    editor: (state as { editor?: HistoryState["editor"] }).editor,
    extraDevices: controls.extraDevices,
  });

  const historyProps = buildHistoryProps({
    canUndo: !!state.past.length,
    canRedo: !!state.future.length,
    onUndo: () => dispatch({ type: "undo" }),
    onRedo: () => dispatch({ type: "redo" }),
    onSave: handleSave,
    onPublish: publishWithValidation,
    saving,
    publishing,
    saveError,
    publishError,
    autoSaveState,
    shop,
    pageId: page.id,
    currentComponents: components,
    editor: (state as Record<string, unknown> & { editor?: Record<string, unknown> }).editor,
    onRestoreVersion: (restored: PageComponent[]) => {
      dispatch({ type: "set", components: restored });
      handleSave();
    },
  });

  // toastProps come from useToastState

  const tourProps = buildTourProps({
    steps: controls.tourSteps,
    run: controls.runTour,
    callback: controls.handleTourCallback,
  });

  const { parentFirst, setParentFirst } = useLayerSelectionPreference();
  const toggleComments = () => setShowComments((value) => !value);

  useSectionModeInitialSelection({ mode, components, setSelectedIds });

  const handleInsertLinkedSection = createLinkedSectionHandler({
    shop,
    components,
    selectedIds,
    dispatch,
    setSelectedIds,
  });

  const { canSavePreset, onSavePreset } = usePresetActions({
    shop,
    components,
    selectedIds,
    setToast,
  });

  return {
    style,
    paletteOnAdd: handleAddFromPalette,
    onInsertImageAsset: handleInsertImageAsset,
    onSetSectionBackground: handleSetSectionBackground,
    selectedIsSection,
    onInsertPreset: handleInsertPreset,
    onInsertLinkedSection: handleInsertLinkedSection,
    presetsSourceUrl: presetsSourceUrl ?? process.env.NEXT_PUBLIC_PAGEBUILDER_PRESETS_URL,
    toolbarProps,
    gridProps,
    startTour: controls.startTour,
    togglePreview: controls.togglePreview,
    showPreview: controls.showPreview,
    toggleComments,
    showComments,
    liveMessage,
    dndContext,
    dropAllowed,
    dragMeta: dragMeta ? { from: dragMeta.from, type: dragMeta.type, count: dragMeta.count, label: dragMeta.label, thumbnail: dragMeta.thumbnail ?? null } : null,
    frameClass: controls.frameClass,
    viewport: controls.viewport,
    viewportStyle: controls.viewportStyle,
    zoom: controls.zoom,
    scrollRef,
    canvasProps: {
      ...canvasProps,
      dropAllowed,
      insertParentId,
      preferParentOnClick: parentFirst,
    },
    activeType,
    previewProps,
    historyProps,
    sidebarProps: {
      components,
      selectedIds,
      onSelectIds: setSelectedIds,
      dispatch,
      editor: (state as { editor?: HistoryState["editor"] }).editor,
      viewport: controls.viewport,
      breakpoints: Array.isArray((state as Record<string, unknown>)["breakpoints"]) ? ((state as Record<string, unknown>)["breakpoints"] as { id: string; label: string; min?: number; max?: number }[]) : [],
      pageId: page.id,
      crossNotices: controls.crossBreakpointNotices,
    },
    toast: toastProps,
    tourProps,
    parentFirst,
    onParentFirstChange: setParentFirst,
    shop,
    pageId: page.id,
    editingSizePx: controls.editingSizePx ?? null,
    setEditingSizePx: controls.setEditingSizePx,
    crossBreakpointNotices: controls.crossBreakpointNotices,
    onCrossBreakpointNoticesChange: controls.setCrossBreakpointNotices,
    mode,
    canSavePreset,
    onSavePreset,
  } as PageBuilderLayoutProps;
};

export default usePageBuilderLayout;
