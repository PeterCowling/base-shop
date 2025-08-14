import { useState, useRef, useEffect } from "react";
import type { Action } from "./state";
import useGuides from "./useGuides";
import { snapToGrid } from "./gridSnap";

interface Options {
  componentId: string;
  widthKey: string;
  heightKey: string;
  widthVal?: string;
  heightVal?: string;
  dispatch: React.Dispatch<Action>;
  gridEnabled?: boolean;
  gridCols: number;
  containerRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export default function useCanvasResize({
  componentId,
  widthKey,
  heightKey,
  widthVal,
  heightVal,
  dispatch,
  gridEnabled = false,
  gridCols,
  containerRef,
  disabled = false,
}: Options) {
  const startRef = useRef<{ x: number; y: number; w: number; h: number } | null>(
    null
  );
  const [resizing, setResizing] = useState(false);
  const [snapWidth, setSnapWidth] = useState(false);
  const [snapHeight, setSnapHeight] = useState(false);
  const { guides, setGuides, siblingEdgesRef, computeSiblingEdges } = useGuides(
    containerRef
  );

  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: PointerEvent) => {
      if (!startRef.current || !containerRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const parent = containerRef.current.parentElement;
      const parentW = parent?.offsetWidth ?? startRef.current.w + dx;
      const parentH = parent?.offsetHeight ?? startRef.current.h + dy;
      let newW = startRef.current.w + dx;
      let newH = startRef.current.h + dy;
      const threshold = 10;
      const left = containerRef.current.offsetLeft;
      const top = containerRef.current.offsetTop;
      let guideX: number | null = null;
      let guideY: number | null = null;
      siblingEdgesRef.current.vertical.forEach((edge) => {
        const right = left + newW;
        if (Math.abs(right - edge) <= threshold) {
          newW = edge - left;
          guideX = edge;
        }
      });
      siblingEdgesRef.current.horizontal.forEach((edge) => {
        const bottom = top + newH;
        if (Math.abs(bottom - edge) <= threshold) {
          newH = edge - top;
          guideY = edge;
        }
      });
      const snapW = e.shiftKey || Math.abs(parentW - newW) <= threshold;
      const snapH = e.shiftKey || Math.abs(parentH - newH) <= threshold;
      if (gridEnabled) {
        const unit = parent ? parent.offsetWidth / gridCols : null;
        if (unit) {
          newW = snapToGrid(newW, unit);
          newH = snapToGrid(newH, unit);
        }
      }
      dispatch({
        type: "resize",
        id: componentId,
        [widthKey]: snapW ? "100%" : `${newW}px`,
        [heightKey]: snapH ? "100%" : `${newH}px`,
      } as any);
      setSnapWidth(snapW || guideX !== null);
      setSnapHeight(snapH || guideY !== null);
      setGuides({
        x: guideX !== null ? guideX - left : null,
        y: guideY !== null ? guideY - top : null,
      });
    };
    const stop = () => {
      setResizing(false);
      setSnapWidth(false);
      setSnapHeight(false);
      setGuides({ x: null, y: null });
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [
    resizing,
    componentId,
    dispatch,
    gridEnabled,
    gridCols,
    widthKey,
    heightKey,
    setGuides,
    siblingEdgesRef,
    containerRef,
  ]);

  const startResize = (e: React.PointerEvent) => {
    if (disabled) return;
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const startWidth =
      widthVal && widthVal.endsWith("px") ? parseFloat(widthVal) : el.offsetWidth;
    const startHeight =
      heightVal && heightVal.endsWith("px")
        ? parseFloat(heightVal)
        : el.offsetHeight;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: startWidth,
      h: startHeight,
    };
    computeSiblingEdges();
    setResizing(true);
  };

  const snapping =
    snapWidth || snapHeight || guides.x !== null || guides.y !== null;

  return { startResize, guides, snapping, resizing } as const;
}
