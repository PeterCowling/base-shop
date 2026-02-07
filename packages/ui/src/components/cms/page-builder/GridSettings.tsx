"use client";

import { useId } from "react";

import { Button, Input } from "../../atoms/shadcn";

interface Props {
  showGrid: boolean;
  toggleGrid: () => void;
  snapToGrid?: boolean;
  toggleSnap?: () => void;
  gridCols: number;
  setGridCols: (n: number) => void;
  zoom?: number;
  setZoom?: (z: number) => void;
  showRulers?: boolean;
  toggleRulers?: () => void;
  /** Show baseline horizontal grid */
  showBaseline?: boolean;
  toggleBaseline?: () => void;
  /** Baseline step in px */
  baselineStep?: number;
  setBaselineStep?: (n: number) => void;
}

const GridSettings = ({ showGrid, toggleGrid, snapToGrid = true, toggleSnap, gridCols, setGridCols, zoom = 1, setZoom, showRulers = false, toggleRulers, showBaseline = false, toggleBaseline, baselineStep = 8, setBaselineStep }: Props) => {
  const baselineId = useId();
  const zoomId = useId();

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant={showGrid ? "default" : "outline"} onClick={toggleGrid}>
        {showGrid ? "Hide grid" : "Show grid"}
      </Button>
      <Button variant={snapToGrid ? "default" : "outline"} onClick={toggleSnap}>
        {snapToGrid ? "Snap on" : "Snap off"}
      </Button>
      <Button variant={showRulers ? "default" : "outline"} onClick={toggleRulers}>
        {showRulers ? "Rulers on" : "Rulers off"}
      </Button>
      <Button variant={showBaseline ? "default" : "outline"} onClick={toggleBaseline}>
        {showBaseline ? "Baseline on" : "Baseline off"}
      </Button>
      <Input
        type="number"
        min={1}
        max={24}
        value={gridCols}
        onChange={(e) => setGridCols(Number(e.target.value))}
        className="w-16"
      />
      <div className="flex items-center gap-2">
        <label className="text-sm" htmlFor={baselineId}>Baseline</label>
        <input
          id={baselineId}
          type="range"
          min={2}
          max={64}
          step={1}
          value={baselineStep}
          onChange={(e) => setBaselineStep?.(Number(e.target.value))}
        />
        <span className="w-8 text-end text-sm">{baselineStep}</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm" htmlFor={zoomId}>Zoom</label>
        <input
          id={zoomId}
          type="range"
          min={0.25}
          max={2}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom?.(Number(e.target.value))}
        />
        <span className="w-10 text-end text-sm">{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default GridSettings;
