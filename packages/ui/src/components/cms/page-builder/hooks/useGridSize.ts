"use client";

import { useEffect, useState } from "react";

export default function useGridSize(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  opts: { showGrid: boolean; gridCols: number; deviceKey?: string | number }
) {
  const [gridSize, setGridSize] = useState(1);

  useEffect(() => {
    if (opts.showGrid && canvasRef.current) {
      setGridSize(canvasRef.current.offsetWidth / opts.gridCols);
    } else {
      setGridSize(1);
    }
  }, [opts.showGrid, opts.gridCols, opts.deviceKey, canvasRef]);

  return gridSize;
}
