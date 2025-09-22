"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { CSSProperties, ComponentProps } from "react";
import React from "react";
import { Toast, Tooltip, Popover, PopoverTrigger, PopoverContent } from "../../atoms";
import PageToolbar from "./PageToolbar";
import PageCanvas from "./PageCanvas";
import PageSidebar from "./PageSidebar";
import HistoryControls from "./HistoryControls";
import Palette from "./Palette";
import PreviewPane from "./PreviewPane";
import DevToolsOverlay from "./devtools/DevToolsOverlay";
import PageBuilderTour, { Step, CallBackProps } from "./PageBuilderTour";
import ResponsiveRightActions from "./ResponsiveRightActions";
import type GridSettings from "./GridSettings";
import type { ComponentType } from "./defaults";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import DragOverlayPreview, { type DragMeta } from "./DragOverlayPreview";
import ErrorBoundary from "./ErrorBoundary";
import useReducedMotion from "../../../hooks/useReducedMotion";

interface LayoutProps {
  style?: CSSProperties;
  paletteOnAdd: (type: ComponentType) => void;
  onInsertImageAsset: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection: boolean;
  onInsertPreset?: (component: PageComponent) => void;
  presetsSourceUrl?: string;
  toolbarProps: React.ComponentProps<typeof PageToolbar>;
  gridProps: React.ComponentProps<typeof GridSettings>;
  startTour: () => void;
  togglePreview: () => void;
  showPreview: boolean;
  toggleComments: () => void;
  showComments: boolean;
  liveMessage: string;
  dndContext: ComponentProps<typeof DndContext>;
  dropAllowed?: boolean | null;
  dragMeta?: DragMeta | null;
  frameClass: Record<string, string>;
  viewport: "desktop" | "tablet" | "mobile";
  viewportStyle: CSSProperties;
  zoom?: number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  canvasProps: React.ComponentProps<typeof PageCanvas>;
  activeType: ComponentType | null;
  previewProps: {
    components: PageComponent[];
    locale: Locale;
    deviceId: string;
    onChange: (id: string) => void;
  };
  historyProps: React.ComponentProps<typeof HistoryControls>;
  sidebarProps: React.ComponentProps<typeof PageSidebar>;
  toast: { open: boolean; message: string; retry?: () => void; onClose: () => void };
  tourProps: { steps: Step[]; run: boolean; callback: (data: CallBackProps) => void };
}

const PageBuilderLayout = ({
  style,
  paletteOnAdd,
  onInsertImageAsset,
  onSetSectionBackground,
  selectedIsSection,
  onInsertPreset,
  presetsSourceUrl,
  toolbarProps,
  gridProps,
  startTour,
  togglePreview,
  showPreview,
  toggleComments,
  showComments,
  liveMessage,
  dndContext,
  dropAllowed,
  dragMeta,
  frameClass,
  viewport,
  viewportStyle,
  zoom = 1,
  scrollRef,
  canvasProps,
  activeType,
  previewProps,
  historyProps,
  sidebarProps,
  toast,
  tourProps,
}: LayoutProps) => {
  const [spacePanning, setSpacePanning] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const [showDevTools, setShowDevTools] = React.useState<boolean>(() => {
    try { return localStorage.getItem("pb:devtools") === "1"; } catch { return false; }
  });
  const [showPalette, setShowPalette] = React.useState<boolean>(() => {
    try { const v = localStorage.getItem("pb:show-palette"); return v === null ? true : v === "1"; } catch { return true; }
  });
  const [paletteWidth, setPaletteWidth] = React.useState<number>(() => {
    try { const v = localStorage.getItem("pb:palette-width"); const n = v ? parseInt(v, 10) : 192; return Number.isFinite(n) ? Math.min(Math.max(n, 160), 360) : 192; } catch { return 192; }
  });
  React.useEffect(() => {
    try { localStorage.setItem("pb:show-palette", showPalette ? "1" : "0"); } catch {}
  }, [showPalette]);
  // Keyboard shortcut: Ctrl/Cmd + B toggles the palette
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isEditable = () => {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        return !!t && ((t as any).isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
      };
      if (isEditable()) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowPalette((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Basic accessibility announcements for screen readers
  const a11y = React.useMemo(() => {
    const L = (toolbarProps as any)?.locale ?? "en";
    const messages: Record<string, Record<string, string>> = {
      en: {
        picked: "Picked up",
        moved: "Moved",
        over: "over",
        dropped: "Dropped",
        into: "into",
        canceled: "Canceled drag",
        instructions:
          "To pick up an item, press space or enter. Use arrow keys to move. Press space or enter to drop, or escape to cancel.",
      },
    };
    const t = (k: string) => (messages[L] || messages.en)[k] || k;
    return {
      screenReaderInstructions: {
        draggable: t("instructions"),
      },
      announcements: {
        onDragStart({ active }: { active: any }) {
          const label = (active?.data?.current as any)?.label || String(active?.id ?? "item");
          return `${t("picked")} ${label}`;
        },
        onDragMove({ active, over }: { active: any; over: any }) {
          if (!over) return undefined;
          const a = (active?.data?.current as any);
          const label = a?.label || String(active?.id ?? "item");
          const overLabel = (over?.data?.current as any)?.label || String(over?.id ?? "target");
          return `${t("moved")} ${label} ${t("over")} ${overLabel}`;
        },
        onDragOver({ active, over }: { active: any; over: any }) {
          if (!over) return undefined;
          const a = (active?.data?.current as any);
          const label = a?.label || String(active?.id ?? "item");
          const overLabel = (over?.data?.current as any)?.label || String(over?.id ?? "target");
          return `${t("moved")} ${label} ${t("over")} ${overLabel}`;
        },
        onDragEnd({ active, over }: { active: any; over: any }) {
          const a = (active?.data?.current as any);
          const label = a?.label || String(active?.id ?? "item");
          if (!over) return `${t("canceled")}`;
          const overLabel = (over?.data?.current as any)?.label || String(over?.id ?? "target");
          return `${t("dropped")} ${label} ${t("into")} ${overLabel}`;
        },
        onDragCancel() {
          return `${t("canceled")}`;
        },
      },
    };
  }, [toolbarProps]);
  React.useEffect(() => {
    try { localStorage.setItem("pb:palette-width", String(paletteWidth)); } catch {}
  }, [paletteWidth]);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable = !!target && ((target as any).isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
      if (editable) return;
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowDevTools((v) => { try { localStorage.setItem('pb:devtools', v ? '0' : '1'); } catch {}; return !v; });
        return;
      }
      if (e.code === 'Space') setSpacePanning(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePanning(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
  return (
  <DndContext
    {...dndContext}
    accessibility={a11y}
    onDragStart={(dndContext as any).onDragStart || (() => {})}
    onDragMove={(dndContext as any).onDragMove || (() => {})}
    onDragEnd={(dndContext as any).onDragEnd || (() => {})}
  >
  {/* A11y: shared drag instructions for handles (replaces deprecated aria-grabbed/dropeffect) */}
  <div id="pb-drag-instructions" className="sr-only">
    To pick up an item, press space or enter. Use arrow keys to move. Press space or enter to drop, or escape to cancel.
  </div>
  <div className="flex gap-4 min-h-0" style={style}>
    <PageBuilderTour {...tourProps} />
    {showPalette && (
      <>
        <aside className="shrink-0" style={{ width: paletteWidth }} data-tour="palette">
          <Palette onAdd={paletteOnAdd} onInsertImage={onInsertImageAsset} onSetSectionBackground={onSetSectionBackground} selectedIsSection={selectedIsSection} />
        </aside>
        <div
          role="separator"
          aria-label="Resize palette"
          className="w-1 shrink-0 cursor-col-resize select-none bg-border/50 hover:bg-border"
          onPointerDown={(e) => {
            const startX = e.clientX;
            const startW = paletteWidth;
            const onMove = (ev: PointerEvent) => {
              const dx = ev.clientX - startX;
              const next = Math.min(Math.max(startW + dx, 160), 360);
              setPaletteWidth(next);
            };
            const onUp = () => {
              window.removeEventListener("pointermove", onMove);
              window.removeEventListener("pointerup", onUp);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
          }}
        />
      </>
    )}
    {!showPalette && (
      <div className="shrink-0 w-8 flex flex-col items-center gap-2 pt-2">
        {/* Quick Components popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Tooltip text="Quick components">
              <button type="button" aria-label="Quick components" className="rounded border border-border-2 bg-surface-2 px-1 text-xs">🧩</button>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2">
            <div className="max-h-[70vh] overflow-auto">
              <Palette
                onAdd={paletteOnAdd}
                onInsertImage={onInsertImageAsset}
                onSetSectionBackground={onSetSectionBackground}
                selectedIsSection={selectedIsSection}
                defaultTab="components"
              />
            </div>
          </PopoverContent>
        </Popover>
        {/* Quick Media popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Tooltip text="Quick media">
              <button type="button" aria-label="Quick media" className="rounded border border-border-2 bg-surface-2 px-1 text-xs">🖼</button>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2">
            <div className="max-h-[70vh] overflow-auto">
              <Palette
                onAdd={paletteOnAdd}
                onInsertImage={onInsertImageAsset}
                onSetSectionBackground={onSetSectionBackground}
                selectedIsSection={selectedIsSection}
                defaultTab="media"
              />
            </div>
          </PopoverContent>
        </Popover>
        <Tooltip text="Show palette">
          <button
            type="button"
            aria-label="Show palette"
            className="rounded border border-border-2 bg-surface-2 px-1 text-xs"
            onClick={() => setShowPalette(true)}
            title="Show palette"
          >
            ▶
          </button>
        </Tooltip>
      </div>
    )}
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      <div className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-2 overflow-x-hidden bg-surface-1/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface-1/70">
        <div data-tour="toolbar" className="min-w-0 flex-1 overflow-x-hidden">
          <PageToolbar {...toolbarProps} />
        </div>
        <ResponsiveRightActions
          gridProps={gridProps}
          onInsertPreset={onInsertPreset}
          presetsSourceUrl={presetsSourceUrl}
          startTour={startTour}
          toggleComments={toggleComments}
          showComments={showComments}
          togglePreview={togglePreview}
          showPreview={showPreview}
          showPalette={showPalette}
          togglePalette={() => setShowPalette((v) => !v)}
        />
      </div>
      <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
        {liveMessage}
      </div>
      {/* Tiny spring/tween for placeholders (reduced-motion aware) */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes pb-fade-scale-in { from { transform: scale(0.96); opacity: .65 } to { transform: scale(1); opacity: 1 } }
          [data-placeholder] { transform-origin: center; animation: pb-fade-scale-in 140ms cubic-bezier(0.16,1,0.3,1); }
        }
      `}</style>
      <div className="flex flex-1 gap-4 min-h-0">
        <ErrorBoundary>
          <div
            ref={scrollRef}
            className="relative max-h-full overflow-auto overscroll-contain min-h-0"
            onPointerDown={(e) => {
              const sc = scrollRef?.current;
              if (!sc) return;
              const enable = e.button === 1 || e.altKey || spacePanning;
              if (!enable) return;
              e.preventDefault();
              const startX = e.clientX;
              const startY = e.clientY;
              const startScrollLeft = sc.scrollLeft;
              const startScrollTop = sc.scrollTop;
              const handleMove = (ev: PointerEvent) => {
                sc.scrollTo({ left: startScrollLeft - (ev.clientX - startX), top: startScrollTop - (ev.clientY - startY) });
              };
              const stop = () => {
                window.removeEventListener("pointermove", handleMove);
                window.removeEventListener("pointerup", stop);
              };
              window.addEventListener("pointermove", handleMove);
              window.addEventListener("pointerup", stop);
            }}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
              <div
              className={`${frameClass[viewport]} shrink-0`}
              style={viewportStyle}
              data-tour="canvas"
              data-viewport={viewport}
              >
                <PageCanvas {...canvasProps} />
                {showDevTools && <DevToolsOverlay scrollRef={scrollRef as any} />}
              </div>
            </div>
          </div>
          <DragOverlay
            dropAnimation={
              reducedMotion
                ? { duration: 0, easing: "linear" }
                : { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", dragSourceOpacity: 0.25 }
            }
          >
            {dragMeta ? (
              <DragOverlayPreview dragMeta={dragMeta} allowed={dropAllowed ?? null} locale={(toolbarProps as any)?.locale ?? 'en'} />
            ) : activeType ? (
              <div className="pointer-events-none rounded border bg-muted px-4 py-2 opacity-50 shadow">{activeType}</div>
            ) : null}
          </DragOverlay>
        {showPreview && <PreviewPane {...previewProps} />}
        </ErrorBoundary>
      </div>
      <div className="sticky bottom-0 z-10 border-t border-border-2 bg-surface-1/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface-1/70">
        <HistoryControls {...historyProps} />
      </div>
    </div>
    <PageSidebar {...sidebarProps} />
    <Toast
      open={toast.open}
      onClose={toast.onClose}
      onClick={toast.retry}
      message={toast.message}
    />
  </div>
  </DndContext>
  );
};

export default PageBuilderLayout;
