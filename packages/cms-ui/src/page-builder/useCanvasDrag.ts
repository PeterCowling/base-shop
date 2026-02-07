"use client";
import type { Dispatch, RefObject } from "react";
import { useEffect, useRef, useState } from "react";

import type { CaptureRef } from "./canvasResize/pointerCapture";
import { releasePointerCaptureSafe, setPointerCaptureSafe } from "./canvasResize/pointerCapture";
import { snapToGrid } from "./gridSnap";
import type { Action } from "./state";
import useGuides from "./useGuides";

interface Options {
  componentId: string;
  dispatch: Dispatch<Action>;
  gridEnabled?: boolean;
  gridCols: number;
  containerRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  leftKey?: string;
  topKey?: string;
  dockX?: "left" | "right" | "center";
  dockY?: "top" | "bottom" | "center";
  zoom?: number;
}

interface DragState {
  originalL: number;
  originalT: number;
  width: number;
  height: number;
  dx: number;
  dy: number;
}

function applyAxisLock(
  dx: number,
  dy: number,
  shiftKey: boolean,
  axisLockRef: React.MutableRefObject<null | "x" | "y">
) {
  if (!shiftKey) {
    axisLockRef.current = null;
    return { dx, dy };
  }
  if (axisLockRef.current === null) {
    axisLockRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
  }
  return axisLockRef.current === "x" ? { dx, dy: 0 } : { dx: 0, dy };
}

function applySiblingSnap(
  state: DragState,
  siblingEdgesRef: React.MutableRefObject<{ vertical: number[]; horizontal: number[] }>,
  threshold: number
) {
  let newL = state.originalL;
  let newT = state.originalT;
  let guideX: number | null = null;
  let guideY: number | null = null;
  let distX: number | null = null;
  let distY: number | null = null;
  for (const edge of siblingEdgesRef.current.vertical) {
    const leftDist = Math.abs(state.originalL - edge);
    const rightDist = Math.abs(state.originalL + state.width - edge);
    if (leftDist <= threshold && (distX === null || leftDist < distX)) {
      newL = edge;
      guideX = edge;
      distX = leftDist;
    }
    if (rightDist <= threshold && (distX === null || rightDist < distX)) {
      newL = edge - state.width;
      guideX = edge;
      distX = rightDist;
    }
  }
  for (const edge of siblingEdgesRef.current.horizontal) {
    const topDist = Math.abs(state.originalT - edge);
    const bottomDist = Math.abs(state.originalT + state.height - edge);
    if (topDist <= threshold && (distY === null || topDist < distY)) {
      newT = edge;
      guideY = edge;
      distY = topDist;
    }
    if (bottomDist <= threshold && (distY === null || bottomDist < distY)) {
      newT = edge - state.height;
      guideY = edge;
      distY = bottomDist;
    }
  }
  return { newL, newT, guideX, guideY, distX, distY };
}

function applyGridSnap({
  newL,
  newT,
  gridEnabled,
  unit,
  threshold,
  guideX,
  guideY,
  distX,
  distY,
}: {
  newL: number;
  newT: number;
  gridEnabled: boolean;
  unit: number | null;
  threshold: number;
  guideX: number | null;
  guideY: number | null;
  distX: number | null;
  distY: number | null;
}) {
  if (!gridEnabled || !unit) {
    return { newL, newT, guideX, guideY, distX, distY };
  }
  const snappedL = snapToGrid(newL, unit);
  const snappedT = snapToGrid(newT, unit);
  const gridDistX = Math.abs(snappedL - newL);
  const gridDistY = Math.abs(snappedT - newT);
  let nextGuideX = guideX;
  let nextGuideY = guideY;
  let nextDistX = distX;
  let nextDistY = distY;
  if (gridDistX <= threshold && (nextDistX === null || gridDistX < nextDistX)) {
    nextGuideX = snappedL;
    nextDistX = gridDistX;
  }
  if (gridDistY <= threshold && (nextDistY === null || gridDistY < nextDistY)) {
    nextGuideY = snappedT;
    nextDistY = gridDistY;
  }
  return {
    newL: snappedL,
    newT: snappedT,
    guideX: nextGuideX,
    guideY: nextGuideY,
    distX: nextDistX,
    distY: nextDistY,
  };
}

function buildDockedPatch({
  newL,
  newT,
  width,
  height,
  parent,
  dockX,
  dockY,
  leftKey,
  topKey,
}: {
  newL: number;
  newT: number;
  width: number;
  height: number;
  parent: HTMLElement | null;
  dockX?: "left" | "right" | "center";
  dockY?: "top" | "bottom" | "center";
  leftKey: string;
  topKey: string;
}) {
  const parentWidth = parent?.offsetWidth ?? 0;
  const parentHeight = parent?.offsetHeight ?? 0;
  const hasParentWidth = parentWidth > 0;
  const hasParentHeight = parentHeight > 0;
  const horizontalCapacity = hasParentWidth ? Math.max(0, parentWidth - width) : null;
  const verticalCapacity = hasParentHeight ? Math.max(0, parentHeight - height) : null;
  const useRight = dockX === "right" && !!horizontalCapacity;
  const useBottom = dockY === "bottom" && !!verticalCapacity;
  if (parent) {
    if (hasParentWidth) {
      const maxL = horizontalCapacity ?? 0;
      newL = maxL > 0 ? Math.min(Math.max(0, newL), maxL) : Math.max(newL, 0);
    }
    if (hasParentHeight) {
      const maxT = verticalCapacity ?? 0;
      newT = maxT > 0 ? Math.min(Math.max(0, newT), maxT) : Math.max(newT, 0);
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
  return { patch, newL, newT };
}

interface DragListenerOptions {
  moving: boolean;
  moveRef: React.MutableRefObject<{ x: number; y: number; l: number; t: number } | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  gridEnabled: boolean;
  gridCols: number;
  leftKey: string;
  topKey: string;
  dockX?: "left" | "right" | "center";
  dockY?: "top" | "bottom" | "center";
  componentId: string;
  dispatch: Dispatch<Action>;
  setGuides: (guides: { x: number | null; y: number | null }) => void;
  siblingEdgesRef: React.MutableRefObject<{ vertical: number[]; horizontal: number[] }>;
  setCurrent: Dispatch<React.SetStateAction<{ left: number; top: number; width: number; height: number }>>;
  setMoving: Dispatch<React.SetStateAction<boolean>>;
  setDistances: Dispatch<React.SetStateAction<{ x: number | null; y: number | null }>>;
  axisLockRef: React.MutableRefObject<null | "x" | "y">;
  captureRef: React.MutableRefObject<CaptureRef["current"]>;
}

function useDragListeners({
  moving,
  moveRef,
  containerRef,
  zoom,
  gridEnabled,
  gridCols,
  leftKey,
  topKey,
  dockX,
  dockY,
  componentId,
  dispatch,
  setGuides,
  siblingEdgesRef,
  setCurrent,
  setMoving,
  setDistances,
  axisLockRef,
  captureRef,
}: DragListenerOptions) {
  const rafRef = useRef<number | null>(null);
  const lastEventRef = useRef<PointerEvent | null>(null);
  useEffect(() => {
    if (!moving) return;
    const processMove = (e: PointerEvent) => {
      if (!moveRef.current || !containerRef.current) return;
      const dxBase = (e.clientX - moveRef.current.x) / Math.max(zoom, 0.0001);
      const dyBase = (e.clientY - moveRef.current.y) / Math.max(zoom, 0.0001);
      const { dx, dy } = applyAxisLock(dxBase, dyBase, e.shiftKey, axisLockRef);
      const originalL = moveRef.current.l + dx;
      const originalT = moveRef.current.t + dy;
      const { offsetWidth: width, offsetHeight: height } = containerRef.current;
      const threshold = 10;
      const siblingSnap = applySiblingSnap(
        { originalL, originalT, width, height, dx, dy },
        siblingEdgesRef,
        threshold
      );
      const parentEl = containerRef.current.parentElement;
      const unit = parentEl ? parentEl.offsetWidth / gridCols : null;
      const gridSnap = applyGridSnap({
        newL: siblingSnap.newL,
        newT: siblingSnap.newT,
        gridEnabled,
        unit,
        threshold,
        guideX: siblingSnap.guideX,
        guideY: siblingSnap.guideY,
        distX: siblingSnap.distX,
        distY: siblingSnap.distY,
      });
      const docked = buildDockedPatch({
        newL: gridSnap.newL,
        newT: gridSnap.newT,
        width,
        height,
        parent: containerRef.current.parentElement,
        dockX,
        dockY,
        leftKey,
        topKey,
      });
      type ResizeAction = import("./state/layout/types").ResizeAction;
      dispatch({ type: "resize", id: componentId, ...docked.patch } as ResizeAction);
      setCurrent({ left: docked.newL, top: docked.newT, width, height });
      setGuides({
        x: gridSnap.guideX !== null ? gridSnap.guideX - docked.newL : null,
        y: gridSnap.guideY !== null ? gridSnap.guideY - docked.newT : null,
      });
      setDistances({ x: gridSnap.distX, y: gridSnap.distY });
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
      releasePointerCaptureSafe(captureRef as CaptureRef);
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
  }, [
    moving,
    componentId,
    dispatch,
    gridEnabled,
    gridCols,
    setGuides,
    siblingEdgesRef,
    containerRef,
    zoom,
    dockX,
    dockY,
    leftKey,
    topKey,
    setCurrent,
    setMoving,
    setDistances,
    axisLockRef,
    captureRef,
    moveRef,
  ]);
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
  const axisLockRef = useRef<null | "x" | "y">(null);
  const captureRef = useRef<CaptureRef["current"]>({ el: null, id: null });
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

  useDragListeners({
    moving,
    moveRef,
    containerRef,
    zoom,
    gridEnabled,
    gridCols,
    leftKey,
    topKey,
    dockX,
    dockY,
    componentId,
    dispatch,
    setGuides,
    siblingEdgesRef,
    setCurrent,
    setMoving,
    setDistances,
    axisLockRef,
    captureRef,
  });

  const startDrag = (e: React.PointerEvent) => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;
    setPointerCaptureSafe(e, captureRef as CaptureRef);
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
