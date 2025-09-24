"use client";

import { locales } from "@acme/i18n/locales";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";
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
import { validateSectionRules } from "@acme/platform-core/validation/sectionRules";
import type { SectionTemplate } from "@acme/types/section/template";
import useGridSize from "./hooks/useGridSize";
import { defaults, CONTAINER_TYPES } from "./defaults";
import {
  buildCanvasProps,
  buildGridProps,
  buildHistoryProps,
  buildPreviewProps,
  buildToastProps,
  buildTourProps,
} from "./buildProps";
import { createToolbarProps } from "./createToolbarProps";
import { createLinkedSectionHandler } from "./createLinkedSectionHandler";
import useMediaLibraryListener from "./useMediaLibraryListener";
import useSectionModeInitialSelection from "./useSectionModeInitialSelection";
import type { PageComponent } from "@acme/types";
import type { PageBuilderLayoutProps, PageBuilderProps } from "./PageBuilder.types";

const DEFAULT_TOAST = { open: false, message: "" } as const;

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
  const [toast, setToast] = useState<{ open: boolean; message: string; retry?: () => void }>(DEFAULT_TOAST);
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
        message: "Auto-save failed. Click to retry.",
        retry: () => {
          setToast((current) => ({ ...current, open: false }));
          retry();
        },
      });
    },
    clearHistory,
  });

  saveRef.current = handleSave;

  // Wrap publish with validation guardrails (hero limit, image width hint)
  const publishWithValidation = async () => {
    try {
      const sections: SectionTemplate[] = (components || [])
        .filter((c: any) => (c as any)?.type === 'Section')
        .map((c: any, idx: number) => ({
          id: `local-${idx}`,
          label: (c as any)?.label || `Section ${idx + 1}`,
          status: 'draft',
          template: c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'editor',
        }));
      const result = validateSectionRules(sections);
      if ((result as any).ok === false) {
        const msg = (result as any).errors?.join('\n') || 'Validation failed';
        setToast({ open: true, message: msg });
        return;
      }
    } catch {
      // non-blocking
    }
    await handlePublish();
  };

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

  const previewProps = buildPreviewProps({
    components,
    locale: controls.locale,
    deviceId: controls.previewDeviceId,
    onChange: controls.setPreviewDeviceId,
    editor: (state as any).editor,
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
    editor: (state as any).editor,
    onRestoreVersion: (restored: PageComponent[]) => {
      dispatch({ type: "set", components: restored });
      handleSave();
    },
  });

  const toastProps = buildToastProps({
    open: toast.open,
    message: toast.message,
    retry: toast.retry,
    onClose: () => setToast((current) => ({ ...current, open: false })),
  });

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
    dragMeta: dragMeta as any,
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
      editor: (state as any).editor,
      viewport: controls.viewport,
      breakpoints: (state as any).breakpoints ?? [],
      pageId: page.id,
      crossNotices: (controls as any).crossBreakpointNotices,
    },
    toast: toastProps,
    tourProps,
    parentFirst,
    onParentFirstChange: setParentFirst,
    shop,
    pageId: page.id,
    editingSizePx: (controls as any).editingSizePx ?? null,
    setEditingSizePx: (controls as any).setEditingSizePx,
    crossBreakpointNotices: (controls as any).crossBreakpointNotices,
    onCrossBreakpointNoticesChange: (controls as any).setCrossBreakpointNotices,
    mode,
    canSavePreset: (() => {
      if (!Array.isArray(selectedIds) || selectedIds.length !== 1) return false;
      const id = selectedIds[0];
      const c = (components || []).find((x: any) => (x as any)?.id === id) as any;
      return !!c && c.type === 'Section';
    })(),
    onSavePreset: async () => {
      try {
        if (!Array.isArray(selectedIds) || selectedIds.length !== 1) {
          setToast({ open: true, message: 'Select a single Section to save as preset' });
          return;
        }
        const id = selectedIds[0];
        const c = (components || []).find((x: any) => (x as any)?.id === id) as any;
        if (!c || c.type !== 'Section') {
          setToast({ open: true, message: 'Selected item is not a Section' });
          return;
        }
        const label = (typeof window !== 'undefined' ? window.prompt('Preset label', c.label || 'Section Preset') : null) || '';
        if (!label.trim()) return;
        const lockedRaw = typeof window !== 'undefined' ? window.prompt('Locked keys (optional, comma-separated)', '') || '' : '';
        const locked = lockedRaw.split(',').map((s: string) => s.trim()).filter(Boolean);
        const preset = {
          id: `${Date.now()}`,
          label,
          template: c,
          locked: locked.length ? locked : undefined,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'editor',
        };
        const target = shop ? `/api/sections/${encodeURIComponent(shop)}/presets` : '/api/sections/default/presets';
        const res = await fetch(target, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preset }) });
        if (!res.ok) throw new Error('Failed to save preset');
        setToast({ open: true, message: 'Preset saved' });
      } catch (err) {
        console.error('save preset failed', err);
        setToast({ open: true, message: 'Failed to save preset' });
      }
    },
  } as PageBuilderLayoutProps;
};

export default usePageBuilderLayout;
