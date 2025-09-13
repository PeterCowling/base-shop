"use client";
import { useState, useRef, useEffect } from "react";
import type { ResizeAction } from "./state/layout";

interface Options {
  componentId: string;
  marginKey: string;
  paddingKey: string;
  marginVal?: string;
  paddingVal?: string;
  dispatch: React.Dispatch<ResizeAction>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

type SpacingType = "margin" | "padding";
type SpacingSide = "top" | "right" | "bottom" | "left";

interface Overlay {
  type: SpacingType;
  side: SpacingSide;
  top: number;
  left: number;
  width: number;
  height: number;
}

export function parseSpacing(value?: string): [number, number, number, number] {
  if (!value) return [0, 0, 0, 0];
  const parts = value
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => parseFloat(p));
  if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
  if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
  if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
  return [parts[0], parts[1], parts[2], parts[3]];
}

function formatSpacing(values: [number, number, number, number]) {
  return values.map((v) => `${Math.round(v)}px`).join(" ");
}

function sideIndex(side: SpacingSide) {
  return side === "top" ? 0 : side === "right" ? 1 : side === "bottom" ? 2 : 3;
}

export default function useCanvasSpacing({
  componentId,
  marginKey,
  paddingKey,
  marginVal,
  paddingVal,
  dispatch,
  containerRef,
}: Options) {
  const startRef = useRef<{
    x: number;
    y: number;
    margin: [number, number, number, number];
    padding: [number, number, number, number];
    width: number;
    height: number;
  } | null>(null);
  const [active, setActive] = useState<null | { type: SpacingType; side: SpacingSide }>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);

  useEffect(() => {
    if (!active) return;
    const handleMove = (e: PointerEvent) => {
      if (!startRef.current) return;
      const { x, y, margin, padding, width, height } = startRef.current;
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      const delta = active.side === "left" || active.side === "right" ? dx : dy;
      const current = active.type === "margin" ? [...margin] : [...padding];
      const idx = sideIndex(active.side);
      current[idx] =
        active.type === "padding" ? Math.max(0, current[idx] + delta) : current[idx] + delta;
      const patchVal = formatSpacing(current as [number, number, number, number]);
      dispatch({
        type: "resize",
        id: componentId,
        [active.type === "margin" ? marginKey : paddingKey]: patchVal,
      });
      // compute overlay
      if (active.type === "padding") {
        let top = 0;
        let left = 0;
        let w = width;
        let h = height;
        if (active.side === "top") {
          h = current[0];
        } else if (active.side === "bottom") {
          h = current[2];
          top = height - h;
        } else if (active.side === "left") {
          w = current[3];
        } else if (active.side === "right") {
          w = current[1];
          left = width - w;
        }
        setOverlay({ type: "padding", side: active.side, top, left, width: w, height: h });
      } else {
        let top = 0;
        let left = 0;
        let w = width;
        let h = height;
        if (active.side === "top") {
          h = current[0];
          top = -h;
        } else if (active.side === "bottom") {
          h = current[2];
          top = height;
        } else if (active.side === "left") {
          w = current[3];
          left = -w;
        } else if (active.side === "right") {
          w = current[1];
          left = width;
        }
        setOverlay({ type: "margin", side: active.side, top, left, width: w, height: h });
      }
    };
    const stop = () => {
      setActive(null);
      setOverlay(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [active, componentId, dispatch, marginKey, paddingKey]);

  const startSpacing = (e: React.PointerEvent, type: SpacingType, side: SpacingSide) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      margin: parseSpacing(marginVal),
      padding: parseSpacing(paddingVal),
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
    setActive({ type, side });
  };

  return { startSpacing, overlay } as const;
}

