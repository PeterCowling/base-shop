"use client";

import { locales } from "@acme/i18n/locales";
import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import PageBuilderTour from "./PageBuilderTour";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import { Button } from "../../atoms/shadcn";
import { Toast } from "../../atoms";
import Palette from "./Palette";
import { getShopFromPath } from "@acme/shared-utils";
import { ulid } from "ulid";
import useFileDrop from "./hooks/useFileDrop";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePageBuilderDnD from "./hooks/usePageBuilderDnD";
import PageToolbar from "./PageToolbar";
import PageCanvas from "./PageCanvas";
import PageSidebar from "./PageSidebar";
import { defaults, CONTAINER_TYPES, type ComponentType } from "./defaults";
import usePageBuilderControls from "./hooks/usePageBuilderControls";
import PreviewPane from "./PreviewPane";
import HistoryControls from "./HistoryControls";

interface Props {
  page: Page;
  history?: HistoryState;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  saving?: boolean;
  publishing?: boolean;
  saveError?: string | null;
  publishError?: string | null;
  onChange?: (components: PageComponent[]) => void;
  style?: CSSProperties;
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
  const formDataRef = useRef<FormData | null>(null);
  const handleSaveShortcut = useCallback(() => {
    if (formDataRef.current) {
      void onSave(formDataRef.current);
    }
  }, [onSave]);
  const {
    deviceId,
    setDeviceId,
    orientation,
    setOrientation,
    rotateDevice,
    device,
    viewport,
    viewportStyle,
    frameClass,
    locale,
    setLocale,
    showPreview,
    togglePreview,
    previewDeviceId,
    setPreviewDeviceId,
    runTour,
    startTour,
    tourSteps,
    handleTourCallback,
    showGrid,
    toggleGrid,
  } = usePageBuilderControls();
  const {
    state,
    components,
    dispatch,
    selectedId,
    setSelectedId,
    gridCols,
    setGridCols,
    liveMessage,
    clearHistory,
  } = usePageBuilderState({
    page,
    history: historyProp,
    onChange,
    onSaveShortcut: handleSaveShortcut,
    onTogglePreview: togglePreview,
    onRotateDevice: rotateDevice,
  });
  const [publishCount, setPublishCount] = useState(0);
  const prevId = useRef(page.id);
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);
  const {
    dragOver,
    setDragOver,
    handleFileDrop,
    progress,
    isValid,
  } = useFileDrop({ shop: shop ?? "", dispatch });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    retry?: () => void;
  }>({
    open: false,
    message: "",
  });
  const [gridSize, setGridSize] = useState(1);
  const [snapPosition, setSnapPosition] = useState<number | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const saveDebounceRef = useRef<number | null>(null);
  const initialRender = useRef(true);

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

  const handleAddFromPalette = useCallback(
    (type: ComponentType) => {
      const isContainer = CONTAINER_TYPES.includes(type);
      const component = {
        id: ulid(),
        type,
        ...(defaults[type] ?? {}),
        ...(isContainer ? { children: [] } : {}),
      } as PageComponent;
      dispatch({ type: "add", component });
      setSelectedId(component.id);
    },
    [dispatch, setSelectedId],
  );

  useEffect(() => {
    if (showGrid && canvasRef.current) {
      setGridSize(canvasRef.current.offsetWidth / gridCols);
    } else {
      setGridSize(1);
    }
  }, [showGrid, device, gridCols]);

  useEffect(() => {
    const idChanged = prevId.current !== page.id;
    if (publishCount > 0 || idChanged) {
      clearHistory();
    }
    if (idChanged) {
      prevId.current = page.id;
    }
  }, [page.id, publishCount, clearHistory]);

  const formData = useMemo(() => {
    const fd = new FormData();
    fd.append("id", page.id);
    fd.append("updatedAt", page.updatedAt);
    fd.append("slug", page.slug);
    fd.append("status", page.status);
    fd.append("title", JSON.stringify(page.seo.title));
    fd.append("description", JSON.stringify(page.seo.description ?? {}));
    fd.append("components", JSON.stringify(components));
    fd.append("history", JSON.stringify(state));
    return fd;
  }, [page, components, state]);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const handleAutoSave = useCallback(() => {
    setAutoSaveState("saving");
    onSave(formData)
      .then(() => {
        setAutoSaveState("saved");
        setTimeout(() => setAutoSaveState("idle"), 1000);
      })
      .catch(() => {
        setAutoSaveState("error");
        setToast({
          open: true,
          message: "Auto-save failed. Click to retry.",
          retry: () => {
            setToast((t) => ({ ...t, open: false }));
            handleAutoSave();
          },
        });
      });
  }, [onSave, formData]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = window.setTimeout(handleAutoSave, 2000);
    return () => {
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
      }
    };
  }, [handleAutoSave, components, state]);

  const handlePublish = useCallback(() => {
    return onPublish(formData).then(() => setPublishCount((c) => c + 1));
  }, [onPublish, formData]);

  return (
    <div className="flex gap-4" style={style}>
      <PageBuilderTour
        steps={tourSteps}
        run={runTour}
        callback={handleTourCallback}
      />
      <aside className="w-48 shrink-0" data-tour="palette">
        <Palette onAdd={handleAddFromPalette} />
      </aside>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <PageToolbar
            deviceId={deviceId}
            setDeviceId={setDeviceId}
            orientation={orientation}
            setOrientation={setOrientation}
            locale={locale}
            setLocale={setLocale}
            locales={locales}
            progress={progress}
            isValid={isValid}
            showGrid={showGrid}
            toggleGrid={toggleGrid}
            gridCols={gridCols}
            setGridCols={setGridCols}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={startTour}
            >
              Tour
            </Button>
            <Button
              variant="outline"
              onClick={togglePreview}
            >
              {showPreview ? "Hide preview" : "Show preview"}
            </Button>
          </div>
        </div>
        <div aria-live="polite" role="status" className="sr-only">
          {liveMessage}
        </div>
        <div className="flex flex-1 gap-4">
          <DndContext {...dndContext}>
            <div
              className={`${frameClass[viewport]} shrink-0`}
              style={viewportStyle}
              data-tour="canvas"
            >
              <PageCanvas
                components={components}
                selectedId={selectedId}
                onSelectId={setSelectedId}
                canvasRef={canvasRef}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onFileDrop={handleFileDrop}
                insertIndex={insertIndex}
                dispatch={dispatch}
                locale={locale}
                containerStyle={{ width: "100%" }}
                showGrid={showGrid}
                gridCols={gridCols}
                viewport={viewport}
                device={device}
                snapPosition={snapPosition}
              />
            </div>
            <DragOverlay>
              {activeType && (
                <div className="pointer-events-none rounded border bg-muted px-4 py-2 opacity-50 shadow">
                  {activeType}
                </div>
              )}
            </DragOverlay>
          </DndContext>
          {showPreview && (
            <PreviewPane
              components={components}
              locale={locale}
              deviceId={previewDeviceId}
              onChange={setPreviewDeviceId}
            />
          )}
        </div>
        <HistoryControls
          canUndo={!!state.past.length}
          canRedo={!!state.future.length}
          onUndo={() => dispatch({ type: "undo" })}
          onRedo={() => dispatch({ type: "redo" })}
          onSave={() => onSave(formData)}
          onPublish={handlePublish}
          saving={saving}
          publishing={publishing}
          saveError={saveError}
          publishError={publishError}
          autoSaveState={autoSaveState}
        />
      </div>
      <PageSidebar
        components={components}
        selectedId={selectedId}
        dispatch={dispatch}
      />
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        onClick={toast.retry}
        message={toast.message}
      />
    </div>
  );
});

export default PageBuilder;
