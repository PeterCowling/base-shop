"use client";

import { locales } from "@acme/i18n/locales";
import { usePathname } from "next/navigation";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import { getShopFromPath } from "@acme/shared-utils";
import { ulid } from "ulid";
import useFileDrop from "./hooks/useFileDrop";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePageBuilderDnD from "./hooks/usePageBuilderDnD";
import usePageBuilderControls from "./hooks/usePageBuilderControls";
import usePageBuilderSave from "./hooks/usePageBuilderSave";
import PageBuilderLayout from "./PageBuilderLayout";
import { defaults, CONTAINER_TYPES, type ComponentType } from "./defaults";

interface Props {
  page: Page; history?: HistoryState; onSave:(fd:FormData)=>Promise<unknown>; onPublish:(fd:FormData)=>Promise<unknown>;
  saving?: boolean; publishing?: boolean; saveError?: string | null; publishError?: string | null;
  onChange?: (components: PageComponent[]) => void; style?: CSSProperties;
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
    [toast, setToast] = useState<{ open: boolean; message: string; retry?: () => void }>({ open: false, message: "" }),
    [gridSize, setGridSize] = useState(1),
    [snapPosition, setSnapPosition] = useState<number | null>(null);

  const { dndContext, insertIndex, activeType } = usePageBuilderDnD({
    components,
    dispatch,
    defaults: defaults as Record<string, Partial<PageComponent>>,
    containerTypes: CONTAINER_TYPES,
    selectId: (id: string) => setSelectedIds([id]),
    gridSize,
    canvasRef,
    setSnapPosition,
  });

  const handleAddFromPalette = (type: ComponentType) => {
    const isContainer = CONTAINER_TYPES.includes(type);
    const component = {
      id: ulid(),
      type,
      ...(defaults[type] ?? {}),
      ...(isContainer ? { children: [] } : {}),
    } as PageComponent;
    dispatch({ type: "add", component });
    setSelectedIds([component.id]);
  };

  useEffect(() => {
    if (controls.showGrid && canvasRef.current) {
      setGridSize(canvasRef.current.offsetWidth / controls.gridCols);
    } else {
      setGridSize(1);
    }
  }, [controls.showGrid, controls.device, controls.gridCols]);

  const { handlePublish, handleSave, autoSaveState } = usePageBuilderSave({
    page,
    components,
    state,
    onSave,
    onPublish,
    formDataDeps: [components, state],
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
  const toolbarProps = {deviceId: controls.deviceId, setDeviceId: controls.setDeviceId, orientation: controls.orientation, setOrientation: controls.setOrientation, locale: controls.locale, setLocale: controls.setLocale, locales, progress, isValid};
  const gridProps = {showGrid: controls.showGrid, toggleGrid: controls.toggleGrid, snapToGrid: controls.snapToGrid, toggleSnap: controls.toggleSnap, gridCols: controls.gridCols, setGridCols: controls.setGridCols, zoom: controls.zoom, setZoom: controls.setZoom, showRulers: controls.showRulers, toggleRulers: controls.toggleRulers};
  const canvasProps = {components, selectedIds, onSelectIds: setSelectedIds, canvasRef, dragOver, setDragOver, onFileDrop: handleFileDrop, insertIndex, dispatch, locale: controls.locale, containerStyle: { width: "100%" }, showGrid: controls.showGrid, gridCols: controls.gridCols, snapEnabled: controls.snapToGrid, showRulers: controls.showRulers, viewport: controls.viewport, device: controls.device, snapPosition, editor: (state as any).editor};
  const previewProps = {components, locale: controls.locale, deviceId: controls.previewDeviceId, onChange: controls.setPreviewDeviceId};
  const historyProps = {canUndo: !!state.past.length, canRedo: !!state.future.length, onUndo: () => dispatch({ type: "undo" }), onRedo: () => dispatch({ type: "redo" }), onSave: handleSave, onPublish: handlePublish, saving, publishing, saveError, publishError, autoSaveState};
  const toastProps = {open: toast.open, message: toast.message, retry: toast.retry, onClose: () => setToast((t) => ({ ...t, open: false }))};
  const tourProps = {steps: controls.tourSteps, run: controls.runTour, callback: controls.handleTourCallback};

  return (
    <PageBuilderLayout
      style={style}
      paletteOnAdd={handleAddFromPalette}
      toolbarProps={toolbarProps}
      gridProps={gridProps}
      startTour={controls.startTour}
      togglePreview={controls.togglePreview}
      showPreview={controls.showPreview}
      liveMessage={liveMessage}
      dndContext={dndContext}
      frameClass={controls.frameClass}
      viewport={controls.viewport}
      viewportStyle={controls.viewportStyle}
      zoom={controls.zoom}
      canvasProps={canvasProps}
      activeType={activeType}
      previewProps={previewProps}
      historyProps={historyProps}
      sidebarProps={{ components, selectedIds, onSelectIds: setSelectedIds, dispatch, editor: (state as any).editor }}
      toast={toastProps}
      tourProps={tourProps}
    />
  );
});

export default PageBuilder;
