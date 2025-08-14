"use client";

import { locales, type Locale } from "@/i18n/locales";
import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import { Button } from "../../atoms/shadcn";
import { Toast, Spinner } from "../../atoms";
import { CheckIcon } from "@radix-ui/react-icons";
import Palette from "./Palette";
import { getShopFromPath } from "@platform-core/utils";
import useFileDrop from "./hooks/useFileDrop";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePageBuilderDnD from "./hooks/usePageBuilderDnD";
import useViewport from "./hooks/useViewport";
import PageToolbar from "./PageToolbar";
import PageCanvas from "./PageCanvas";
import PageSidebar from "./PageSidebar";
import { defaults, CONTAINER_TYPES } from "./defaults";
import { devicePresets, type DevicePreset } from "@ui/utils/devicePresets";
import { usePreviewDevice } from "@ui/hooks";

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
  } = usePageBuilderState({ page, history: historyProp, onChange });

  const [deviceId, setDeviceId] = usePreviewDevice(devicePresets[0].id);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const device = useMemo<DevicePreset>(() => {
    const preset =
      devicePresets.find((d) => d.id === deviceId) ?? devicePresets[0];
    return orientation === "portrait"
      ? { ...preset, orientation }
      : {
          ...preset,
          width: preset.height,
          height: preset.width,
          orientation,
        };
  }, [deviceId, orientation]);
  const viewport: "desktop" | "tablet" | "mobile" = device.type;
  const [locale, setLocale] = useState<Locale>("en");
  const [showPreview, setShowPreview] = useState(false);
  const [previewViewport, setPreviewViewport] =
    useState<"desktop" | "tablet" | "mobile">("desktop");
  const presetByType = useMemo(
    () => ({
      desktop: devicePresets.find((d) => d.type === "desktop")!,
      tablet: devicePresets.find((d) => d.type === "tablet")!,
      mobile: devicePresets.find((d) => d.type === "mobile")!,
    }),
    []
  );
  const previewDevice = useMemo<DevicePreset>(
    () => presetByType[previewViewport],
    [presetByType, previewViewport]
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const {
    viewportStyle: previewViewportStyle,
    frameClass: previewFrameClass,
  } = useViewport(previewDevice);
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
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(1);
  const [snapPosition, setSnapPosition] = useState<number | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const saveDebounceRef = useRef<number | null>(null);
  const initialRender = useRef(true);

  const {
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    insertIndex,
    activeType,
  } = usePageBuilderDnD({
    components,
    dispatch,
    defaults,
    containerTypes: CONTAINER_TYPES,
    selectId: setSelectedId,
    gridSize,
    canvasRef,
    setSnapPosition,
  });

  const { viewportStyle, frameClass } = useViewport(device);

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
    saveDebounceRef.current = window.setTimeout(handleAutoSave, 1000);
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
      <aside className="w-48 shrink-0">
        <Palette />
      </aside>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <PageToolbar
            viewport={viewport}
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
            toggleGrid={() => setShowGrid((g) => !g)}
            gridCols={gridCols}
            setGridCols={setGridCols}
          />
          <div className="flex items-center gap-2">
            {autoSaveState === "saving" && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Saving…
              </div>
            )}
            {autoSaveState === "saved" && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <CheckIcon className="h-4 w-4 text-green-500" /> Saved
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview((p) => !p)}
            >
              {showPreview ? "Hide preview" : "Show preview"}
            </Button>
          </div>
        </div>
        <div aria-live="polite" role="status" className="sr-only">
          {liveMessage}
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <div className={frameClass[viewport]} style={viewportStyle}>
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
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant={
                  previewViewport === "desktop" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setPreviewViewport("desktop")}
              >
                Desktop
              </Button>
              <Button
                variant={
                  previewViewport === "tablet" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setPreviewViewport("tablet")}
              >
                Tablet
              </Button>
              <Button
                variant={
                  previewViewport === "mobile" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setPreviewViewport("mobile")}
              >
                Mobile
              </Button>
            </div>
            <div
              className={previewFrameClass[previewViewport]}
              style={previewViewportStyle}
            >
              <PageCanvas
                preview
                components={components}
                locale={locale}
                containerStyle={{ width: "100%" }}
                viewport={previewViewport}
                device={previewDevice}
                canvasRef={previewRef}
              />
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={() => dispatch({ type: "undo" })} disabled={!state.past.length}>
            Undo
          </Button>
          <Button onClick={() => dispatch({ type: "redo" })} disabled={!state.future.length}>
            Redo
          </Button>
          <div className="flex flex-col gap-1">
            <Button onClick={() => onSave(formData)} disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : "Save"}
            </Button>
            {saveError && (
              <p className="text-sm text-red-500">{saveError}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              onClick={handlePublish}
              disabled={publishing}
              data-tour="publish"
            >
              {publishing ? <Spinner className="h-4 w-4" /> : "Publish"}
            </Button>
            {publishError && (
              <p className="text-sm text-red-500">{publishError}</p>
            )}
          </div>
        </div>
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
