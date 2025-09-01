"use client";

import { Button, Input } from "../../atoms/shadcn";

interface Props {
  showGrid: boolean;
  toggleGrid: () => void;
  gridCols: number;
  setGridCols: (n: number) => void;
}

const GridSettings = ({ showGrid, toggleGrid, gridCols, setGridCols }: Props) => (
  <div className="flex items-center justify-end gap-2">
    <Button variant={showGrid ? "default" : "outline"} onClick={toggleGrid}>
      {showGrid ? "Hide grid" : "Show grid"}
    </Button>
    <Input
      type="number"
      min={1}
      max={24}
      value={gridCols}
      onChange={(e) => setGridCols(Number(e.target.value))}
      className="w-16"
    />
  </div>
);

export default GridSettings;
