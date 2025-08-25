"use client";
import { useState, useRef, useEffect } from "react";
import type { ResizeAction } from "./state/layout";
import useGuides from "./useGuides";
import { snapToGrid } from "./gridSnap";

interface Options {
  componentId: string;
  widthKey: string;
  heightKey: string;
  widthVal?: string;
  heightVal?: string;
  dispatch: React.Dispatch<ResizeAction>;
  gridEnabled?: boolean;
  gridCols: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
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
  const [current, setCurrent] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  });
  const { guides, setGuides, siblingEdgesRef, computeSiblingEdges } = useGuides(
    containerRef
  );
  const [distances, setDistances] = useState<{ x: number | null; y: number | null }>(
    { x: null, y: null }
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
      const originalW = startRef.current.w + dx;
      const originalH = startRef.current.h + dy;
      let newW = originalW;
      let newH = originalH;
      const threshold = 10;
      const left = containerRef.current.offsetLeft;
      const top = containerRef.current.offsetTop;
      let guideX: number | null = null;
      let guideY: number | null = null;
      let distX: number | null = null;
      let distY: number | null = null;
      siblingEdgesRef.current.vertical.forEach((edge) => {
        const rightDist = Math.abs(left + originalW - edge);
        if (rightDist <= threshold && (distX === null || rightDist < distX)) {
          newW = edge - left;
          guideX = edge;
          distX = rightDist;
        }
      });
      siblingEdgesRef.current.horizontal.forEach((edge) => {
        const bottomDist = Math.abs(top + originalH - edge);
        if (bottomDist <= threshold && (distY === null || bottomDist < distY)) {
          newH = edge - top;
          guideY = edge;
          distY = bottomDist;
        }
      });
      if (gridEnabled && parent) {
        const unit = parent.offsetWidth / gridCols;
        const snappedW = snapToGrid(newW, unit);
        const snappedH = snapToGrid(newH, unit);
        const gridDistX = Math.abs(snappedW - newW);
        const gridDistY = Math.abs(snappedH - newH);
        newW = snappedW;
        newH = snappedH;
        if (gridDistX <= threshold && (distX === null || gridDistX < distX)) {
          guideX = left + snappedW;
          distX = gridDistX;
        }
        if (gridDistY <= threshold && (distY === null || gridDistY < distY)) {
          guideY = top + snappedH;
          distY = gridDistY;
        }
      }
      const snapW = e.shiftKey || Math.abs(parentW - newW) <= threshold;
      const snapH = e.shiftKey || Math.abs(parentH - newH) <= threshold;
      dispatch({
        type: "resize",
        id: componentId,
        [widthKey]: snapW ? "100%" : `${newW}px`,
        [heightKey]: snapH ? "100%" : `${newH}px`,
      });
      setCurrent({ width: newW, height: newH, left, top });
      setSnapWidth(snapW || guideX !== null);
      setSnapHeight(snapH || guideY !== null);
      setGuides({
        x: guideX !== null ? guideX - left : null,
        y: guideY !== null ? guideY - top : null,
      });
      setDistances({ x: distX, y: distY });
    };
    const stop = () => {
      setResizing(false);
      setSnapWidth(false);
      setSnapHeight(false);
      setGuides({ x: null, y: null });
      setDistances({ x: null, y: null });
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
    setCurrent({
      width: startWidth,
      height: startHeight,
      left: el.offsetLeft,
      top: el.offsetTop,
    });
    computeSiblingEdges();
    setResizing(true);
  };

  const snapping =
    snapWidth || snapHeight || guides.x !== null || guides.y !== null;

  return {
    startResize,
    guides,
    distances,
    snapping,
    resizing,
    width: current.width,
    height: current.height,
    left: current.left,
    top: current.top,
  } as const;
}
