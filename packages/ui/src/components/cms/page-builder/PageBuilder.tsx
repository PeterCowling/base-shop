"use client";

import { locales, type Locale } from "@/i18n/locales";
import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { ulid } from "ulid";
import type { Page, PageComponent, HistoryState, MediaItem } from "@acme/types";
import { Button } from "../../atoms/shadcn";
import { Toast, Spinner } from "../../atoms";
import Palette from "./Palette";
import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
} from "../blocks";
import { getShopFromPath } from "@platform-core/utils";
import useFileUpload from "@ui/hooks/useFileUpload";
import usePageBuilderState from "./hooks/usePageBuilderState";
import usePageBuilderDnD from "./hooks/usePageBuilderDnD";
import PageToolbar from "./PageToolbar";
import PageCanvas from "./PageCanvas";
import PageSidebar from "./PageSidebar";

/* ════════════════ component catalogue ════════════════ */
type ComponentType =
  | keyof typeof atomRegistry
  | keyof typeof moleculeRegistry
  | keyof typeof organismRegistry
  | keyof typeof containerRegistry
  | keyof typeof layoutRegistry;

const CONTAINER_TYPES = Object.keys(containerRegistry) as ComponentType[];

const defaults: Partial<Record<ComponentType, Partial<PageComponent>>> = {
  HeroBanner: { minItems: 1, maxItems: 5 },
  ValueProps: { minItems: 1, maxItems: 6 },
  ReviewsCarousel: { minItems: 1, maxItems: 10 },
  SearchBar: { placeholder: "Search products…", limit: 5 },
  ProductFilter: { showSize: true, showColor: true, showPrice: true },
  ProductGrid: {
    minItems: 1,
    maxItems: 3,
    desktopItems: 3,
    tabletItems: 2,
    mobileItems: 1,
    mode: "collection",
  },
  ProductCarousel: {
    minItems: 1,
    maxItems: 10,
    desktopItems: 4,
    tabletItems: 2,
    mobileItems: 1,
    mode: "collection",
  },
  RecommendationCarousel: { minItems: 1, maxItems: 4 },
  Testimonials: { minItems: 1, maxItems: 10 },
  TestimonialSlider: { minItems: 1, maxItems: 10 },
  ImageSlider: { minItems: 1, maxItems: 10 },
  AnnouncementBar: {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
  },
  Lookbook: { minItems: 0, maxItems: 10 },
  MultiColumn: { columns: 2, gap: "1rem" },
  Divider: { width: "100%", height: "1px" },
  Spacer: { width: "100%", height: "1rem" },
};

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

  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [locale, setLocale] = useState<Locale>("en");
  const [publishCount, setPublishCount] = useState(0);
  const prevId = useRef(page.id);
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(1);
  const [snapPosition, setSnapPosition] = useState<number | null>(null);

  const {
    onDrop,
    setAltText,
    handleUpload,
    progress,
    error,
    pendingFile,
    isValid,
  } = useFileUpload({
    shop: shop ?? "",
    requiredOrientation: "landscape",
    onUploaded: (item: MediaItem) => {
      dispatch({
        type: "add",
        component: {
          id: ulid(),
          type: "Image",
          src: item.url,
          alt: item.altText,
          ...(defaults.Image ?? {}),
        } as PageComponent,
      });
    },
  });

  const handleFileDrop = useCallback(
    (ev: DragEvent<HTMLDivElement>) => {
      setDragOver(false);
      onDrop(ev.dataTransfer).catch((err: unknown) => {
        console.error(err);
      });
    },
    [onDrop]
  );

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

  const widthMap = useMemo(
    () => ({ desktop: "100%", tablet: "768px", mobile: "375px" }) as const,
    []
  );
  const containerStyle = useMemo(
    () => ({ width: widthMap[viewport] }),
    [viewport, widthMap]
  );

  useEffect(() => {
    if (showGrid && canvasRef.current) {
      setGridSize(canvasRef.current.offsetWidth / gridCols);
    } else {
      setGridSize(1);
    }
  }, [showGrid, viewport, gridCols]);

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

  const handlePublish = useCallback(() => {
    return onPublish(formData).then(() => setPublishCount((c) => c + 1));
  }, [onPublish, formData]);

  return (
    <div className="flex gap-4" style={style}>
      <aside className="w-48 shrink-0">
        <Palette />
      </aside>
      <div className="flex flex-1 flex-col gap-4">
        <PageToolbar
          viewport={viewport}
          setViewport={setViewport}
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
            containerStyle={containerStyle}
            showGrid={showGrid}
            gridCols={gridCols}
            viewport={viewport}
            snapPosition={snapPosition}
          />
          <DragOverlay>
            {activeType && (
              <div className="pointer-events-none rounded border bg-muted px-4 py-2 opacity-50 shadow">
                {activeType}
              </div>
            )}
          </DragOverlay>
        </DndContext>
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
            <Button variant="outline" onClick={handlePublish} disabled={publishing}>
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
        message={toast.message}
      />
    </div>
  );
});

export default PageBuilder;
