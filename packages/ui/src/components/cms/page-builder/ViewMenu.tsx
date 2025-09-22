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
}

export function ViewMenuContent({ showPreview, togglePreview, showComments, toggleComments, startTour, showPalette, togglePalette, parentFirst, onParentFirstChange, gridProps }: Props) {
  const clampZoom = (z: number) => Math.min(2, Math.max(0.25, Math.round(z * 100) / 100));
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

      {/* Zoom controls (parity with View menu: Zoom In/Out/Reset) */}
      {gridProps && (
        <div className="mt-2 space-y-1">
          <div className="text-sm font-medium">Zoom</div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                aria-label="Zoom out"
                onClick={() => gridProps.setZoom?.(clampZoom((gridProps.zoom ?? 1) - 0.1))}
              >
                −
              </Button>
              <span className="w-14 text-center text-sm">{Math.round((gridProps.zoom ?? 1) * 100)}%</span>
              <Button
                variant="outline"
                aria-label="Zoom in"
                onClick={() => gridProps.setZoom?.(clampZoom((gridProps.zoom ?? 1) + 0.1))}
              >
                +
              </Button>
            </div>
            <Button variant="outline" aria-label="Reset zoom" onClick={() => gridProps.setZoom?.(1)}>Reset</Button>
          </div>
        </div>
      )}

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
              <span className="w-8 text-right text-sm">{gridProps.baselineStep}</span>
            </div>
          </div>
        </div>
      )}
      <div className="pt-1">
        <Button variant="outline" className="w-full" onClick={startTour}>
          Start tour
        </Button>
      </div>
    </div>
  );
}

export default function ViewMenu(props: Props) {
  return (
    <Popover>
      <Tooltip text="View options">
        <PopoverTrigger asChild>
          <Button variant="outline" aria-label="View options">View</Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-64">
        <ViewMenuContent {...props} />
      </PopoverContent>
    </Popover>
  );
}
