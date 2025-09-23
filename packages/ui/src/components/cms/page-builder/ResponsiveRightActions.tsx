// packages/ui/src/components/cms/page-builder/ResponsiveRightActions.tsx
"use client";

import React from "react";
import CanvasControlsMenu from "./CanvasControlsMenu";
import { ViewMenuContent, default as ViewMenu } from "./ViewMenu";
import type GridSettings from "./GridSettings";
import type { PageComponent } from "@acme/types";

interface Props {
  gridProps: React.ComponentProps<typeof GridSettings>;
  onInsertPreset?: (component: PageComponent) => void;
  presetsSourceUrl?: string;
  startTour: () => void;
  toggleComments: () => void;
  showComments: boolean;
  togglePreview: () => void;
  showPreview: boolean;
  showPalette: boolean;
  togglePalette: () => void;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
}

export default function ResponsiveRightActions({
  gridProps,
  onInsertPreset: _onInsertPreset,
  presetsSourceUrl: _presetsSourceUrl,
  startTour,
  toggleComments,
  showComments,
  togglePreview,
  showPreview,
  showPalette,
  togglePalette,
  parentFirst,
  onParentFirstChange,
  crossBreakpointNotices,
  onCrossBreakpointNoticesChange,
}: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [w, setW] = React.useState<number>(0);
  const [viewOpen, setViewOpen] = React.useState(false);
  React.useEffect(() => {
    const open = () => setViewOpen(true);
    window.addEventListener("pb:open-view", open as EventListener);
    return () => window.removeEventListener("pb:open-view", open as EventListener);
  }, []);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = entry?.contentRect?.width ?? el.clientWidth;
      setW(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Simple heuristic thresholds: keep Canvas visible; hide View under 380px.
  const showView = w >= 380;

  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-2 justify-end max-w-full">
      <CanvasControlsMenu gridProps={gridProps} />
      {showView ? (
        <ViewMenu
          open={viewOpen}
          onOpenChange={setViewOpen}
          showPreview={showPreview}
          togglePreview={togglePreview}
          showComments={showComments}
          toggleComments={toggleComments}
          startTour={startTour}
          showPalette={showPalette}
          togglePalette={togglePalette}
          parentFirst={parentFirst}
          onParentFirstChange={onParentFirstChange}
          gridProps={gridProps}
          crossBreakpointNotices={crossBreakpointNotices}
          onCrossBreakpointNoticesChange={onCrossBreakpointNoticesChange}
        />
      ) : null}
      {!showView && null}
    </div>
  );
}
