"use client";
import { useEffect,useRef, useState } from "react";

import { snapToGrid } from "./gridSnap";
import type { Action } from "./state";
import useGuides from "./useGuides";

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
  const rafRef = useRef<number | null>(null);
  const lastEventRef = useRef<PointerEvent | null>(null);
  const axisLockRef = useRef<null | 'x' | 'y'>(null);
  const captureRef = useRef<{ el: Element | null; id: number | null }>({ el: null, id: null });
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
    const processMove = (e: PointerEvent) => {
      if (!moveRef.current || !containerRef.current) return;
      let dx = (e.clientX - moveRef.current.x) / Math.max(zoom, 0.0001);
      let dy = (e.clientY - moveRef.current.y) / Math.max(zoom, 0.0001);
      // Axis lock: when Shift is held, lock to the dominant axis for the current drag session
      if (e.shiftKey) {
        if (axisLockRef.current === null) {
          axisLockRef.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        }
        if (axisLockRef.current === 'x') dy = 0; else dx = 0;
      } else {
        axisLockRef.current = null;
      }
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
      const parentWidth = parent?.offsetWidth ?? 0;
      const parentHeight = parent?.offsetHeight ?? 0;
      const hasParentWidth = parentWidth > 0;
      const hasParentHeight = parentHeight > 0;
      const horizontalCapacity = hasParentWidth ? Math.max(0, parentWidth - width) : null;
      const verticalCapacity = hasParentHeight ? Math.max(0, parentHeight - height) : null;
      const useRight = dockX === "right" && !!horizontalCapacity;
      const useBottom = dockY === "bottom" && !!verticalCapacity;
      // Restrict to parent bounds when a parent exists with measurable bounds
      if (parent) {
        if (hasParentWidth) {
          const maxL = horizontalCapacity ?? 0;
          if (maxL > 0) {
            newL = Math.min(Math.max(0, newL), maxL);
          } else {
            newL = Math.max(newL, 0);
          }
        }
        if (hasParentHeight) {
          const maxT = verticalCapacity ?? 0;
          if (maxT > 0) {
            newT = Math.min(Math.max(0, newT), maxT);
          } else {
            newT = Math.max(newT, 0);
          }
        }
      }
      const patch: Record<string, string> = {};
      if (useRight && parent) {
        const right = Math.round(Math.max(0, parentWidth - (newL + width)));
        patch.right = `${right}px`;
      } else {
        patch[leftKey] = `${Math.round(newL)}px`;
      }
      if (useBottom && parent) {
        const bottom = Math.round(Math.max(0, parentHeight - (newT + height)));
        patch.bottom = `${bottom}px`;
      } else {
        patch[topKey] = `${Math.round(newT)}px`;
      }
      type ResizeAction = import("./state/layout/types").ResizeAction;
      dispatch({ type: "resize", id: componentId, ...patch } as ResizeAction);
      setCurrent({ left: newL, top: newT, width, height });
      setGuides({
        x: guideX !== null ? guideX - newL : null,
        y: guideY !== null ? guideY - newT : null,
      });
      setDistances({ x: distX, y: distY });
    };
    const handleMove = (e: PointerEvent) => {
      lastEventRef.current = e;
      const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";
      if (isTest) {
        processMove(e);
        return;
      }
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(() => {
          const ev = lastEventRef.current;
          if (ev) processMove(ev);
          rafRef.current = null;
        });
      }
    };
    const stop = () => {
      setMoving(false);
      setGuides({ x: null, y: null });
      setDistances({ x: null, y: null });
      // Release pointer capture if held
      try {
        if (captureRef.current?.el && captureRef.current?.id != null) {
          (captureRef.current.el as unknown as { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(captureRef.current.id);
        }
      } catch {}
      captureRef.current = { el: null, id: null };
      if (rafRef.current != null) {
        try { cancelAnimationFrame(rafRef.current); } catch {}
        rafRef.current = null;
      }
    };
    const onKeyDown = (ke: KeyboardEvent) => { if (ke.key === "Escape") stop(); };
    try { window.addEventListener("pointermove", handleMove, { passive: true }); } catch { window.addEventListener("pointermove", handleMove as unknown as EventListener); }
    window.addEventListener("pointerup", stop);
    window.addEventListener("blur", stop);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      try { window.removeEventListener("pointermove", handleMove as unknown as EventListener); } catch {}
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("blur", stop);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moving, componentId, dispatch, gridEnabled, gridCols, setGuides, siblingEdgesRef, containerRef, zoom, dockX, dockY, leftKey, topKey]);

  const startDrag = (e: React.PointerEvent) => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;
    // Capture pointer to keep events consistent during drag (skip in tests for JSDOM compatibility)
    try {
      const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";
      if (!isTest) {
        (e.target as Element)?.setPointerCapture?.(e.pointerId);
        captureRef.current = { el: e.target as Element, id: e.pointerId };
      }
    } catch {}
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
