import { useState, useEffect, useMemo, useRef } from "react";

interface Options {
  canvasRef: React.RefObject<HTMLDivElement>;
  showGrid: boolean;
  gridCols: number;
}

export default function useViewport({
  canvasRef,
  showGrid,
  gridCols,
}: Options) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const widthMap = useMemo(
    () => ({ desktop: 1024, tablet: 768, mobile: 375 }) as const,
    []
  );
  const [canvasWidth, setCanvasWidth] = useState(widthMap.desktop);
  const [scale, setScale] = useState(1);
  const prevWidth = useRef(widthMap.desktop);
  const [gridSize, setGridSize] = useState(1);

  useEffect(() => {
    const nextWidth = widthMap[viewport];
    const prev = prevWidth.current;
    setCanvasWidth(nextWidth);
    setScale(prev / nextWidth);
    const raf = requestAnimationFrame(() => setScale(1));
    prevWidth.current = nextWidth;
    return () => cancelAnimationFrame(raf);
  }, [viewport, widthMap]);

  const viewportStyle = useMemo(
    () => ({
      width: `${canvasWidth}px`,
      transform: `scale(${scale})`,
      transformOrigin: "top center",
      transition: "transform 0.3s ease",
    }),
    [canvasWidth, scale]
  );

  const frameClass = useMemo(
    () => ({
      desktop: "",
      tablet: "rounded-xl border border-muted-foreground/40 p-2",
      mobile: "rounded-[2rem] border border-muted-foreground/40 p-4",
    }),
    []
  );

  useEffect(() => {
    if (showGrid && canvasRef.current) {
      setGridSize(canvasRef.current.offsetWidth / gridCols);
    } else {
      setGridSize(1);
    }
  }, [showGrid, viewport, gridCols, canvasRef]);

  return {
    viewport,
    setViewport,
    viewportStyle,
    frameClass,
    gridSize,
  } as const;
}

