"use client";
import { useState, useRef, useEffect } from "react";
import type { Action } from "./state";
import useGuides from "./useGuides";
import { snapToGrid } from "./gridSnap";

interface Options {
  componentId: string;
  dispatch: React.Dispatch<Action>;
  gridEnabled?: boolean;
  gridCols: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  leftKey?: string;
  topKey?: string;
  dockX?: "left" | "right" | "center";
  dockY?: "top" | "bottom" | "center";
  zoom?: number;
}

export default function useCanvasDrag({
  componentId,
  dispatch,
  gridEnabled = false,
  gridCols,
  containerRef,
  disabled = false,
  leftKey = "left",
  topKey = "top",
  dockX,
  dockY,
  zoom = 1,
}: Options) {
  const moveRef = useRef<{ x: number; y: number; l: number; t: number } | null>(
    null
  );
  const [moving, setMoving] = useState(false);
  const [current, setCurrent] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const { guides, setGuides, siblingEdgesRef, computeSiblingEdges } = useGuides(
    containerRef
  );
  const [distances, setDistances] = useState<{ x: number | null; y: number | null }>(
    { x: null, y: null }
  );

  useEffect(() => {
    if (!moving) return;
    const handleMove = (e: PointerEvent) => {
      if (!moveRef.current || !containerRef.current) return;
      const dx = (e.clientX - moveRef.current.x) / Math.max(zoom, 0.0001);
      const dy = (e.clientY - moveRef.current.y) / Math.max(zoom, 0.0001);
      const originalL = moveRef.current.l + dx;
      const originalT = moveRef.current.t + dy;
      let newL = originalL;
      let newT = originalT;
      const threshold = 10;
      let guideX: number | null = null;
      let guideY: number | null = null;
      let distX: number | null = null;
      let distY: number | null = null;
      const { offsetWidth: width, offsetHeight: height } =
        containerRef.current;
      for (const edge of siblingEdgesRef.current.vertical) {
        const leftDist = Math.abs(originalL - edge);
        const rightDist = Math.abs(originalL + width - edge);
        if (leftDist <= threshold && (distX === null || leftDist < distX)) {
          newL = edge;
          guideX = edge;
          distX = leftDist;
        }
        if (rightDist <= threshold && (distX === null || rightDist < distX)) {
          newL = edge - width;
          guideX = edge;
          distX = rightDist;
        }
      }
      for (const edge of siblingEdgesRef.current.horizontal) {
        const topDist = Math.abs(originalT - edge);
        const bottomDist = Math.abs(originalT + height - edge);
        if (topDist <= threshold && (distY === null || topDist < distY)) {
          newT = edge;
          guideY = edge;
          distY = topDist;
        }
        if (bottomDist <= threshold && (distY === null || bottomDist < distY)) {
          newT = edge - height;
          guideY = edge;
          distY = bottomDist;
        }
      }
      const parentEl = containerRef.current.parentElement;
      const unit = parentEl ? parentEl.offsetWidth / gridCols : null;
      if (gridEnabled && unit) {
        const snappedL = snapToGrid(newL, unit);
        const snappedT = snapToGrid(newT, unit);
        const gridDistX = Math.abs(snappedL - newL);
        const gridDistY = Math.abs(snappedT - newT);
        newL = snappedL;
        newT = snappedT;
        if (gridDistX <= threshold && (distX === null || gridDistX < distX)) {
          guideX = snappedL;
          distX = gridDistX;
        }
        if (gridDistY <= threshold && (distY === null || gridDistY < distY)) {
          guideY = snappedT;
          distY = gridDistY;
        }
      }
      // Compute docked offsets when docking is enabled
      const parent = containerRef.current.parentElement;
      const useRight = dockX === "right";
      const useBottom = dockY === "bottom";
      const patch: Record<string, string> = {};
      if (useRight && parent) {
        const right = Math.round((parent.offsetWidth - (newL + width)));
        patch.right = `${right}px`;
      } else {
        patch[leftKey] = `${Math.round(newL)}px`;
      }
      if (useBottom && parent) {
        const bottom = Math.round((parent.offsetHeight - (newT + height)));
        patch.bottom = `${bottom}px`;
      } else {
        patch[topKey] = `${Math.round(newT)}px`;
      }
      dispatch({ type: "resize", id: componentId, ...(patch as any) });
      setCurrent({ left: newL, top: newT, width, height });
      setGuides({
        x: guideX !== null ? guideX - newL : null,
        y: guideY !== null ? guideY - newT : null,
      });
      setDistances({ x: distX, y: distY });
    };
    const stop = () => {
      setMoving(false);
      setGuides({ x: null, y: null });
      setDistances({ x: null, y: null });
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [moving, componentId, dispatch, gridEnabled, gridCols, setGuides, siblingEdgesRef, containerRef, zoom]);

  const startDrag = (e: React.PointerEvent) => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;
    moveRef.current = {
      x: e.clientX,
      y: e.clientY,
      l: el.offsetLeft,
      t: el.offsetTop,
    };
    setCurrent({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
    computeSiblingEdges();
    setMoving(true);
  };

  const snapping = guides.x !== null || guides.y !== null;

  return {
    startDrag,
    guides,
    distances,
    snapping,
    moving,
    left: current.left,
    top: current.top,
    width: current.width,
    height: current.height,
  } as const;
}
