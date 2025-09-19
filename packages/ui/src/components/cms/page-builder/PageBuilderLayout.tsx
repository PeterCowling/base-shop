"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { CSSProperties, ComponentProps } from "react";
import { Button } from "../../atoms/shadcn";
import { Toast } from "../../atoms";
import PageToolbar from "./PageToolbar";
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
  toolbarProps: React.ComponentProps<typeof PageToolbar>;
  gridProps: React.ComponentProps<typeof GridSettings>;
  startTour: () => void;
  togglePreview: () => void;
  showPreview: boolean;
  liveMessage: string;
  dndContext: ComponentProps<typeof DndContext>;
  frameClass: Record<string, string>;
  viewport: "desktop" | "tablet" | "mobile";
  viewportStyle: CSSProperties;
  zoom?: number;
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
  toolbarProps,
  gridProps,
  startTour,
  togglePreview,
  showPreview,
  liveMessage,
  dndContext,
  frameClass,
  viewport,
  viewportStyle,
  zoom = 1,
  canvasProps,
  activeType,
  previewProps,
  historyProps,
  sidebarProps,
  toast,
  tourProps,
}: LayoutProps) => (
  <div className="flex gap-4" style={style}>
    <PageBuilderTour {...tourProps} />
    <aside className="w-48 shrink-0" data-tour="palette">
      <Palette onAdd={paletteOnAdd} />
    </aside>
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageToolbar {...toolbarProps} />
        <div className="flex items-center gap-2">
          <GridSettings {...gridProps} />
          <Button variant="outline" onClick={startTour}>
            Tour
          </Button>
          <Button variant="outline" onClick={togglePreview}>
            {showPreview ? "Hide preview" : "Show preview"}
          </Button>
        </div>
      </div>
      <div aria-live="polite" role="status" className="sr-only">
        {liveMessage}
      </div>
      <div className="flex flex-1 gap-4">
        <DndContext {...dndContext}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <div
              className={`${frameClass[viewport]} shrink-0`}
              style={viewportStyle}
              data-tour="canvas"
            >
              <PageCanvas {...canvasProps} />
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

export default PageBuilderLayout;
