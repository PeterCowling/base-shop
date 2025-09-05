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
  const { state, components, dispatch, selectedId, setSelectedId, liveMessage, clearHistory } = usePageBuilderState({
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
    selectId: setSelectedId,
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
    setSelectedId(component.id);
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
  const gridProps = {showGrid: controls.showGrid, toggleGrid: controls.toggleGrid, gridCols: controls.gridCols, setGridCols: controls.setGridCols};
  const canvasProps = {components, selectedId, onSelectId: setSelectedId, canvasRef, dragOver, setDragOver, onFileDrop: handleFileDrop, insertIndex, dispatch, locale: controls.locale, containerStyle: { width: "100%" }, showGrid: controls.showGrid, gridCols: controls.gridCols, viewport: controls.viewport, device: controls.device, snapPosition};
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
      canvasProps={canvasProps}
      activeType={activeType}
      previewProps={previewProps}
      historyProps={historyProps}
      sidebarProps={{ components, selectedId, dispatch }}
      toast={toastProps}
      tourProps={tourProps}
    />
  );
});

export default PageBuilder;
