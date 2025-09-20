"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { CSSProperties, ComponentProps } from "react";
import React from "react";
import { Button } from "../../atoms/shadcn";
import { Toast } from "../../atoms";
import PageToolbar from "./PageToolbar";
import PresetsModal from "./PresetsModal";
import PageCanvas from "./PageCanvas";
import PageSidebar from "./PageSidebar";
import HistoryControls from "./HistoryControls";
import Palette from "./Palette";
import PreviewPane from "./PreviewPane";
import PageBuilderTour, { Step, CallBackProps } from "./PageBuilderTour";
import GridSettings from "./GridSettings";
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
  <div className="flex gap-4" style={style}>
    <PageBuilderTour {...tourProps} />
    <aside className="w-48 shrink-0" data-tour="palette">
      <Palette onAdd={paletteOnAdd} onInsertImage={onInsertImageAsset} onSetSectionBackground={onSetSectionBackground} selectedIsSection={selectedIsSection} />
    </aside>
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div data-tour="toolbar">
          <PageToolbar {...toolbarProps} />
        </div>
        <div className="flex items-center gap-2">
          <GridSettings {...gridProps} />
          {onInsertPreset && <PresetsModal onInsert={onInsertPreset} sourceUrl={presetsSourceUrl} />}
          <Button variant="outline" onClick={startTour}>
            Tour
          </Button>
          <Button variant="outline" onClick={toggleComments}>
            {showComments ? "Hide comments" : "Show comments"}
          </Button>
          <Button variant="outline" onClick={togglePreview}>
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
        {liveMessage}
      </div>
      <div className="flex flex-1 gap-4">
        <DndContext
          {...dndContext}
          onDragStart={(dndContext as any).onDragStart || (() => {})}
          onDragMove={(dndContext as any).onDragMove || (() => {})}
          onDragEnd={(dndContext as any).onDragEnd || (() => {})}
        >
          <div
            ref={scrollRef}
            className="relative max-h-full overflow-auto"
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
        </DndContext>
        {showPreview && <PreviewPane {...previewProps} />}
      </div>
      <HistoryControls {...historyProps} />
    </div>
    <PageSidebar {...sidebarProps} />
    <Toast
      open={toast.open}
      onClose={toast.onClose}
      onClick={toast.retry}
      message={toast.message}
    />
  </div>
  );
};

export default PageBuilderLayout;
