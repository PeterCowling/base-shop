// packages/ui/src/components/cms/page-builder/ViewMenu.tsx
"use client";

import { Button, Popover, PopoverContent, PopoverTrigger, Switch, Tooltip } from "../../atoms";
import type { ComponentProps } from "react";
import type GridSettings from "./GridSettings";

interface Props {
  showPreview: boolean;
  togglePreview: () => void;
  showComments: boolean;
  toggleComments: () => void;
  startTour: () => void;
  showPalette?: boolean;
  togglePalette?: () => void;
  parentFirst?: boolean;
  onParentFirstChange?: (v: boolean) => void;
  // Optional canvas settings to expose in the View menu for parity with spec
  gridProps?: ComponentProps<typeof GridSettings>;
  // Cross-breakpoint override notices
  crossBreakpointNotices?: boolean;
  onCrossBreakpointNoticesChange?: (v: boolean) => void;
  // Controlled popover support
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ViewMenuContent({ showPreview, togglePreview, showComments, toggleComments, startTour, showPalette, togglePalette, parentFirst, onParentFirstChange, gridProps, crossBreakpointNotices, onCrossBreakpointNoticesChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">View</div>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Preview</span>
        <Switch checked={showPreview} onChange={togglePreview} />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Comments</span>
        <Switch checked={showComments} onChange={toggleComments} />
      </label>
      {typeof showPalette === "boolean" && togglePalette && (
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Palette</span>
          <Switch checked={showPalette} onChange={togglePalette} />
        </label>
      )}
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Layer selection (Parent-first)</span>
        <Switch checked={!!parentFirst} onChange={() => onParentFirstChange?.(!parentFirst)} />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>Cross-breakpoint notifications</span>
        <Switch checked={!!crossBreakpointNotices} onChange={() => onCrossBreakpointNoticesChange?.(!crossBreakpointNotices)} />
      </label>

      {/* Zoom controls removed per requirements */}

      {/* Canvas indications moved into View for parity with spec */}
      {gridProps && (
        <div className="mt-2 space-y-2">
          <div className="text-sm font-medium">Canvas Indications</div>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Grid</span>
            <Switch checked={!!gridProps.showGrid} onChange={gridProps.toggleGrid} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Snap to grid</span>
            <Switch checked={!!gridProps.snapToGrid} onChange={gridProps.toggleSnap} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Rulers</span>
            <Switch checked={!!gridProps.showRulers} onChange={gridProps.toggleRulers} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>Baseline grid</span>
            <Switch checked={!!gridProps.showBaseline} onChange={gridProps.toggleBaseline} />
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">Baseline step</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={64}
                step={1}
                value={gridProps.baselineStep}
                onChange={(e) => gridProps.setBaselineStep?.(Number(e.target.value))}
              />
              <span className="w-8 text-end text-sm">{gridProps.baselineStep}</span>
            </div>
          </div>
        </div>
      )}
      {/* Start tour moved to Help modal */}
    </div>
  );
}

export default function ViewMenu(props: Props) {
  const { open, onOpenChange, ...contentProps } = props;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip text="View options">
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label="View options">View</Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-64">
        <ViewMenuContent {...(contentProps as any)} />
      </PopoverContent>
    </Popover>
  );
}
