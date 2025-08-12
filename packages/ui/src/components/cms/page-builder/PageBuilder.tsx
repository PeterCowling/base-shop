"use client";

import { locales, type Locale } from "@/i18n/locales";
import { usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import { ulid } from "ulid";
import type { Page, PageComponent, HistoryState, MediaItem } from "@acme/types";
import { Button } from "../../atoms/shadcn";
import { Toast } from "../../atoms";
import Palette from "./Palette";
import {
  atomRegistry,
  moleculeRegistry,
  organismRegistry,
  containerRegistry,
  layoutRegistry,
} from "../blocks";
import { getShopFromPath } from "@platform-core/utils";
import useMediaUpload from "@ui/hooks/useMediaUpload";
import { historyStateSchema, reducer, type Action } from "./state";
import usePageBuilderDrag from "./usePageBuilderDrag";
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
  MultiColumn: { columns: 2, gap: "1rem" },
  Divider: { width: "100%", height: "1px" },
  Spacer: { width: "100%", height: "1rem" },
};

interface Props {
  page: Page;
  history?: HistoryState;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  onChange?: (components: PageComponent[]) => void;
  style?: CSSProperties;
}

const PageBuilder = memo(function PageBuilder({
  page,
  history: historyProp,
  onSave,
  onPublish,
  onChange,
  style,
}: Props) {
  const storageKey = `page-builder-history-${page.id}`;
  const migrate = useCallback(
    (comps: PageComponent[]): PageComponent[] =>
      comps.map((c) =>
        c.type === "Section" || c.type === "MultiColumn"
          ? { ...c, children: c.children ?? [] }
          : c
      ),
    []
  );

  const [state, rawDispatch] = useReducer(reducer, undefined, (): HistoryState => {
    const initial = migrate(page.components as PageComponent[]);
    const fromServer = historyProp ?? page.history;
    const parsedServer = fromServer
      ? (() => {
          try {
            const valid = historyStateSchema.parse(fromServer);
            return { ...valid, present: migrate(valid.present) };
          } catch {
            return { past: [], present: initial, future: [], gridCols: 12 };
          }
        })()
      : { past: [], present: initial, future: [], gridCols: 12 };

    if (typeof window === "undefined") {
      return parsedServer;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) throw new Error("no stored state");
      const parsed = historyStateSchema.parse(JSON.parse(stored));
      return { ...parsed, present: migrate(parsed.present) };
    } catch (err) {
      console.warn("Failed to parse stored page builder state", err);
      return parsedServer;
    }
  });

  const components = state.present;
  const [gridCols, setGridCols] = useState(state.gridCols);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const dispatch = useCallback(
    (action: Action) => {
      rawDispatch(action);
      if (action.type === "add") {
        setLiveMessage("Block added");
      } else if (action.type === "move") {
        setLiveMessage("Block moved");
      } else if (action.type === "resize") {
        setLiveMessage("Block resized");
      }
    },
    [rawDispatch]
  );
  useEffect(() => {
    if (!liveMessage) return;
    const t = setTimeout(() => setLiveMessage(""), 500);
    return () => clearTimeout(t);
  }, [liveMessage]);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [locale, setLocale] = useState<Locale>("en");
  const [publishCount, setPublishCount] = useState(0);
  const prevId = useRef(page.id);
  const pathname = usePathname() ?? "";
  const shop = useMemo(() => getShopFromPath(pathname), [pathname]);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(1);

  const {
    onDrop,
    setAltText,
    handleUpload,
    progress,
    error,
    pendingFile,
    isValid,
  } = useMediaUpload({
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

  const { sensors, handleDragMove, handleDragEnd } = usePageBuilderDrag({
    components,
    dispatch,
    defaults,
    containerTypes: CONTAINER_TYPES,
    setInsertIndex,
    selectId: setSelectedId,
    gridSize,
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
    onChange?.(components);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [components, onChange, state, storageKey]);

  useEffect(() => {
    const idChanged = prevId.current !== page.id;
    if (publishCount > 0 || idChanged) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
    }
    if (idChanged) {
      prevId.current = page.id;
    }
  }, [page.id, publishCount, storageKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if (k === "y") {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
        setGridCols={(n) => {
          setGridCols(n);
          dispatch({ type: "set-grid-cols", gridCols: n });
        }}
      />
        <div aria-live="polite" role="status" className="sr-only">
          {liveMessage}
        </div>
        <PageCanvas
          components={components}
          selectedId={selectedId}
          onSelectId={setSelectedId}
          sensors={sensors}
          handleDragMove={handleDragMove}
          handleDragEnd={handleDragEnd}
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
        />
        <div className="flex gap-2">
          <Button onClick={() => dispatch({ type: "undo" })} disabled={!state.past.length}>
            Undo
          </Button>
          <Button onClick={() => dispatch({ type: "redo" })} disabled={!state.future.length}>
            Redo
          </Button>
          <Button onClick={() => onSave(formData)}>Save</Button>
          <Button variant="outline" onClick={handlePublish}>
            Publish
          </Button>
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
