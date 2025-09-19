"use client";

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
}

const GridSettings = ({ showGrid, toggleGrid, snapToGrid = true, toggleSnap, gridCols, setGridCols, zoom = 1, setZoom, showRulers = false, toggleRulers }: Props) => (
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
    <Input
      type="number"
      min={1}
      max={24}
      value={gridCols}
      onChange={(e) => setGridCols(Number(e.target.value))}
      className="w-16"
    />
    <div className="flex items-center gap-2">
      <label className="text-sm">Zoom</label>
      <input
        type="range"
        min={0.25}
        max={2}
        step={0.05}
        value={zoom}
        onChange={(e) => setZoom?.(Number(e.target.value))}
      />
      <span className="w-10 text-right text-sm">{Math.round(zoom * 100)}%</span>
    </div>
  </div>
);

export default GridSettings;
