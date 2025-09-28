// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";
import { useState, useRef, useEffect } from "react";
import type { ResizeAction } from "./state/layout";
import useGuides from "./useGuides";
import type { Handle } from "./canvasResize/types";
import { applyAspectRatio } from "./canvasResize/aspect";
import { clampToParent } from "./canvasResize/bounds";
import { applySnapping } from "./canvasResize/snap";
import { computePatch } from "./canvasResize/patch";
import { setPointerCaptureSafe, releasePointerCaptureSafe } from "./canvasResize/pointerCapture";
import { createKeyboardNudge } from "./canvasResize/keyboardNudge";

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
  const rafRef = useRef<number | null>(null);
  const lastEventRef = useRef<PointerEvent | null>(null);
  const captureRef = useRef<{ el: Element | null; id: number | null }>({ el: null, id: null });
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
    const processMove = (e: PointerEvent) => {
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
      const ar = applyAspectRatio(
        e.shiftKey,
        handle,
        ratio,
        newW,
        newH,
        dx,
        dy,
        startL,
        startT,
        left,
        top
      );
      newW = ar.newW;
      newH = ar.newH;
      left = ar.left;
      top = ar.top;

      const snap = applySnapping(left, top, newW, newH, siblingEdgesRef as any, {
        gridEnabled,
        gridCols,
        parent,
        threshold,
      });
      newW = snap.width;
      newH = snap.height;
      const guideX: number | null = snap.guideX;
      const guideY: number | null = snap.guideY;
      const distX: number | null = snap.distX;
      const distY: number | null = snap.distY;
      const snapW = e.altKey || Math.abs(parentW - newW) <= threshold;
      const snapH = e.altKey || Math.abs(parentH - newH) <= threshold;
      const parent2 = containerRef.current.parentElement;
      // Restrict to parent bounds if present
      const clamped = clampToParent(parent2, left, top, newW, newH);
      left = clamped.left;
      top = clamped.top;
      newW = clamped.width;
      newH = clamped.height;

      const patch = computePatch({
        widthKey,
        heightKey,
        leftKey,
        topKey,
        handle,
        left,
        top,
        width: newW,
        height: newH,
        parent: parent2,
        dockX,
        dockY,
        snapW,
        snapH,
      });
      dispatch({ type: "resize", id: componentId, ...patch });
      setCurrent({ width: newW, height: newH, left, top });
      setSnapWidth(snapW || guideX !== null);
      setSnapHeight(snapH || guideY !== null);
      setGuides({
        x: guideX !== null ? guideX - left : null,
        y: guideY !== null ? guideY - top : null,
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
      setResizing(false);
      setSnapWidth(false);
      setSnapHeight(false);
      setGuides({ x: null, y: null });
      setDistances({ x: null, y: null });
      // Release pointer capture if held
      releasePointerCaptureSafe(captureRef as any);
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
    dockX,
    dockY,
    leftKey,
    topKey,
  ]);

  const startResize = (e: React.PointerEvent, handle: Handle = "se") => {
    if (disabled) return;
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    // Capture pointer to keep events consistent during resize (skip in tests for JSDOM compatibility)
    setPointerCaptureSafe(e, captureRef as any);
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
  const nudgeByKeyboard = createKeyboardNudge({
    containerRef,
    widthVal,
    heightVal,
    widthKey,
    heightKey,
    componentId,
    dispatch,
    setKbResizing,
    setCurrent,
    disabled,
  });

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
