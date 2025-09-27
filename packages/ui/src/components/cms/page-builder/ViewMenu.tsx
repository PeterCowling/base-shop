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

export function ViewMenuContent({ showPreview, togglePreview, showComments, toggleComments, startTour: _startTour, showPalette, togglePalette, parentFirst, onParentFirstChange, gridProps, crossBreakpointNotices, onCrossBreakpointNoticesChange }: Props) {
  return (
    <div className="space-y-2">
      {/* i18n-exempt -- internal CMS menu label */}
      <div className="text-sm font-medium">View</div>
      <label className="flex items-center justify-between gap-4 text-sm">
        {/* i18n-exempt -- internal CMS toggle label */}
        <span>Preview</span>
        <Switch checked={showPreview} onChange={togglePreview} />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        {/* i18n-exempt -- internal CMS toggle label */}
        <span>Comments</span>
        <Switch checked={showComments} onChange={toggleComments} />
      </label>
      {typeof showPalette === "boolean" && togglePalette && (
        <label className="flex items-center justify-between gap-4 text-sm">
          {/* i18n-exempt -- internal CMS toggle label */}
          <span>Palette</span>
          <Switch checked={showPalette} onChange={togglePalette} />
        </label>
      )}
      <label className="flex items-center justify-between gap-4 text-sm">
        {/* i18n-exempt -- internal CMS toggle label */}
        <span>Layer selection (Parent-first)</span>
        <Switch checked={!!parentFirst} onChange={() => onParentFirstChange?.(!parentFirst)} />
      </label>
      <label className="flex items-center justify-between gap-4 text-sm">
        {/* i18n-exempt -- internal CMS toggle label */}
        <span>Cross-breakpoint notifications</span>
        <Switch checked={!!crossBreakpointNotices} onChange={() => onCrossBreakpointNoticesChange?.(!crossBreakpointNotices)} />
      </label>

      {/* Zoom controls removed per requirements */}

      {/* Canvas indications moved into View for parity with spec */}
      {gridProps && (
        <div className="mt-2 space-y-2">
          {/* i18n-exempt -- internal CMS section label */}
          <div className="text-sm font-medium">Canvas Indications</div>
          <label className="flex items-center justify-between gap-4 text-sm">
            {/* i18n-exempt -- internal CMS toggle label */}
            <span>Grid</span>
            <Switch checked={!!gridProps.showGrid} onChange={gridProps.toggleGrid} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            {/* i18n-exempt -- internal CMS toggle label */}
            <span>Snap to grid</span>
            <Switch checked={!!gridProps.snapToGrid} onChange={gridProps.toggleSnap} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            {/* i18n-exempt -- internal CMS toggle label */}
            <span>Rulers</span>
            <Switch checked={!!gridProps.showRulers} onChange={gridProps.toggleRulers} />
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            {/* i18n-exempt -- internal CMS toggle label */}
            <span>Baseline grid</span>
            <Switch checked={!!gridProps.showBaseline} onChange={gridProps.toggleBaseline} />
          </label>
          <div className="flex items-center justify-between gap-2">
            {/* i18n-exempt -- internal CMS label */}
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
  const { open, onOpenChange, ...rest } = props;
  const contentProps: Omit<Props, "open" | "onOpenChange"> = rest;
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {/* i18n-exempt -- internal CMS tooltip */}
      <Tooltip text="View options">
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label="View options">
            {/* i18n-exempt -- internal CMS button label */}
            View
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-64">
        <ViewMenuContent {...contentProps} />
      </PopoverContent>
    </Popover>
  );
}
