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
  leftKey?: string;
  topKey?: string;
  dockX?: "left" | "right" | "center";
  dockY?: "top" | "bottom" | "center";
  zoom?: number;
}

type Handle = "se" | "ne" | "sw" | "nw" | "e" | "w" | "n" | "s";

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
  leftKey = "left",
  topKey = "top",
  dockX,
  dockY,
  zoom = 1,
}: Options) {
  const startRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
    l: number;
    t: number;
    handle: Handle;
    ratio: number | null;
  } | null>(
    null
  );
  const [resizing, setResizing] = useState(false);
  // When resizing via keyboard, we briefly show the overlay without pointer listeners
  const [kbResizing, setKbResizing] = useState(false);
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
      const { handle, w, h, l: startL, t: startT, ratio } = startRef.current;
      const dx = (e.clientX - startRef.current.x) / Math.max(zoom, 0.0001);
      const dy = (e.clientY - startRef.current.y) / Math.max(zoom, 0.0001);
      const parent = containerRef.current.parentElement;
      const parentW = parent?.offsetWidth ?? w + dx;
      const parentH = parent?.offsetHeight ?? h + dy;
      let newW = w;
      let newH = h;
      let left = startL;
      let top = startT;
      const threshold = 10;

      // Horizontal resizing
      if (handle.includes("e")) newW = w + dx;
      if (handle.includes("w")) {
        newW = w - dx;
        left = startL + dx;
      }
      // Vertical resizing
      if (handle.includes("s")) newH = h + dy;
      if (handle.includes("n")) {
        newH = h - dy;
        top = startT + dy;
      }

      // Maintain aspect ratio when Shift is held
      if (e.shiftKey && ratio && ratio > 0) {
        if (handle.length === 2) {
          if (Math.abs(dx) >= Math.abs(dy)) {
            newH = newW / ratio;
            if (handle.includes("n")) top = startT + (h - newH);
            if (handle.includes("w")) left = startL + (w - newW);
          } else {
            newW = newH * ratio;
            if (handle.includes("w")) left = startL + (w - newW);
            if (handle.includes("n")) top = startT + (h - newH);
          }
        } else if (handle === "e" || handle === "w") {
          newH = newW / ratio;
          if (handle === "w") left = startL + (w - newW);
        } else if (handle === "n" || handle === "s") {
          newW = newH * ratio;
          if (handle === "n") top = startT + (h - newH);
        }
      }
      let guideX: number | null = null;
      let guideY: number | null = null;
      let distX: number | null = null;
      let distY: number | null = null;
      siblingEdgesRef.current.vertical.forEach((edge) => {
        const rightDist = Math.abs(left + newW - edge);
        if (rightDist <= threshold && (distX === null || rightDist < distX)) {
          newW = edge - left;
          guideX = edge;
          distX = rightDist;
        }
      });
      siblingEdgesRef.current.horizontal.forEach((edge) => {
        const bottomDist = Math.abs(top + newH - edge);
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
      const snapW = e.altKey || Math.abs(parentW - newW) <= threshold;
      const snapH = e.altKey || Math.abs(parentH - newH) <= threshold;
      const parent2 = containerRef.current.parentElement;
      const patch: Record<string, string> = {
        [widthKey]: snapW ? "100%" : `${newW}px`,
        [heightKey]: snapH ? "100%" : `${newH}px`,
      } as any;
      // Horizontal edge adjustments
      if (handle.includes("w")) {
        // West: moving the left edge
        if (dockX !== "right") patch[leftKey] = `${Math.round(left)}px`;
        // If docked to right, we leave right as-is (left not used)
      } else if (handle.includes("e") && dockX === "right" && parent2) {
        const right = Math.round(parent2.offsetWidth - (left + newW));
        patch.right = `${right}px`;
      }
      // Vertical edge adjustments
      if (handle.includes("n")) {
        // North: moving the top edge
        if (dockY !== "bottom") patch[topKey] = `${Math.round(top)}px`;
      } else if (handle.includes("s") && dockY === "bottom" && parent2) {
        const bottom = Math.round(parent2.offsetHeight - (top + newH));
        patch.bottom = `${bottom}px`;
      }
      dispatch({ type: "resize", id: componentId, ...(patch as any) });
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
    zoom,
  ]);

  const startResize = (e: React.PointerEvent, handle: Handle = "se") => {
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
      l: el.offsetLeft,
      t: el.offsetTop,
      handle,
      ratio: startHeight > 0 ? startWidth / startHeight : null,
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

  // Keyboard-driven resizing: adjusts width/height and flashes the overlay
  const nudgeByKeyboard = (
    direction: "left" | "right" | "up" | "down",
    step: number
  ) => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;
    const startWidth =
      widthVal && widthVal.endsWith("px") ? parseFloat(widthVal) : el.offsetWidth;
    const startHeight =
      heightVal && heightVal.endsWith("px") ? parseFloat(heightVal) : el.offsetHeight;
    let newW = startWidth;
    let newH = startHeight;
    if (direction === "left") newW = Math.max(1, startWidth - step);
    if (direction === "right") newW = Math.max(1, startWidth + step);
    if (direction === "up") newH = Math.max(1, startHeight - step);
    if (direction === "down") newH = Math.max(1, startHeight + step);

    dispatch({
      type: "resize",
      id: componentId,
      [widthKey]: `${Math.round(newW)}px`,
      [heightKey]: `${Math.round(newH)}px`,
    });
    setCurrent({ width: newW, height: newH, left: el.offsetLeft, top: el.offsetTop });
    setKbResizing(true);
    // Clear the overlay shortly after key interaction
    window.clearTimeout((nudgeByKeyboard as any)._t);
    (nudgeByKeyboard as any)._t = window.setTimeout(() => setKbResizing(false), 300);
  };

  return {
    startResize,
    guides,
    distances,
    snapping,
    resizing,
    kbResizing,
    nudgeByKeyboard,
    width: current.width,
    height: current.height,
    left: current.left,
    top: current.top,
  } as const;
}
