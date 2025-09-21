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
import PageBuilderTour, { Step, CallBackProps } from "./PageBuilderTour";
import ResponsiveRightActions from "./ResponsiveRightActions";
import type GridSettings from "./GridSettings";
import type { ComponentType } from "./defaults";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";

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
  React.useEffect(() => {
    try { localStorage.setItem("pb:palette-width", String(paletteWidth)); } catch {}
  }, [paletteWidth]);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable = !!target && ((target as any).isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');
      if (editable) return;
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
    onDragStart={(dndContext as any).onDragStart || (() => {})}
    onDragMove={(dndContext as any).onDragMove || (() => {})}
    onDragEnd={(dndContext as any).onDragEnd || (() => {})}
  >
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
      <div className="flex flex-1 gap-4 min-h-0">
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
              </div>
            </div>
          </div>
          <DragOverlay>
            {activeType && (
              <div className="pointer-events-none rounded border bg-muted px-4 py-2 opacity-50 shadow">
                {activeType}
              </div>
            )}
          </DragOverlay>
        {showPreview && <PreviewPane {...previewProps} />}
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
