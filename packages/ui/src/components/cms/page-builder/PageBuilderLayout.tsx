"use client";

import { DndContext, DragOverlay, defaultDropAnimation, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import type { CSSProperties, ComponentProps } from "react";
import React from "react";
import { Toast } from "../../atoms";
import PageToolbar from "./PageToolbar";
import PageCanvas from "./PageCanvas";
import PageSidebar from "./PageSidebar";
import HistoryControls from "./HistoryControls";
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
import EmptyCanvasOverlay from "./EmptyCanvasOverlay";
import CommandPalette from "./CommandPalette";
import useDndA11y from "./hooks/useDndA11y";
import usePaletteState from "./hooks/usePaletteState";
import useDevToolsToggle from "./hooks/useDevToolsToggle";
import useCommandPalette from "./hooks/useCommandPalette";
import useSpacePanning from "./hooks/useSpacePanning";
import PaletteSidebar from "./PaletteSidebar";
import QuickPaletteControls from "./QuickPaletteControls";
import PlaceholderAnimations from "./PlaceholderAnimations";

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
  const reducedMotion = useReducedMotion();
  const { showDevTools } = useDevToolsToggle();
  const { showPalette, setShowPalette, paletteWidth, setPaletteWidth } = usePaletteState();
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const a11y = useDndA11y((toolbarProps as any)?.locale ?? "en");
  const { onPointerDown } = useSpacePanning(scrollRef);

  // (Optional) live message toasts can be surfaced by parent if desired
  return (
  <>
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
      <PaletteSidebar
        width={paletteWidth}
        onWidthChange={setPaletteWidth}
        onAdd={paletteOnAdd}
        onInsertImage={onInsertImageAsset}
        onSetSectionBackground={onSetSectionBackground}
        selectedIsSection={selectedIsSection}
      />
    )}
    {!showPalette && (
      <QuickPaletteControls
        onAdd={paletteOnAdd}
        onInsertImage={onInsertImageAsset}
        onSetSectionBackground={onSetSectionBackground}
        selectedIsSection={selectedIsSection}
        onShowPalette={() => setShowPalette(true)}
      />
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
      <PlaceholderAnimations />
      <div className="flex flex-1 gap-4 min-h-0">
        <ErrorBoundary>
          <div
            ref={scrollRef}
            className="relative max-h-full overflow-auto overscroll-contain min-h-0"
            onPointerDown={onPointerDown}
          >
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
              <div
                className={`${frameClass[viewport]} shrink-0`}
                style={viewportStyle}
                data-tour="canvas"
                data-viewport={viewport}
              >
                <div className="relative">
                  <PageCanvas {...canvasProps} />
                  {Array.isArray((canvasProps as any)?.components) && (canvasProps as any).components.length === 0 && (
                    <EmptyCanvasOverlay
                      onAddSection={() => paletteOnAdd("Section" as ComponentType)}
                      onOpenPalette={() => setShowPalette(true)}
                      onOpenPresets={() => window.dispatchEvent(new Event('pb:open-presets'))}
                    />
                  )}
                </div>
                {showDevTools && <DevToolsOverlay scrollRef={scrollRef as any} />}
              </div>
            </div>
          </div>
          <DragOverlay
            dropAnimation={
              reducedMotion
                ? { duration: 0, easing: "linear" }
                : {
                    ...defaultDropAnimation,
                    duration: 220,
                    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                    sideEffects: defaultDropAnimationSideEffects({
                      styles: { active: { opacity: "0.25" } },
                    }),
                  }
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
  <CommandPalette
    open={cmdOpen}
    onOpenChange={setCmdOpen}
    components={(canvasProps as any)?.components ?? []}
    selectedIds={(canvasProps as any)?.selectedIds ?? []}
    dispatch={(canvasProps as any)?.dispatch ?? (() => {})}
    onSelectIds={(canvasProps as any)?.onSelectIds ?? (() => {})}
  />
  </>
  );
};

export default PageBuilderLayout;
