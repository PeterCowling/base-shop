"use client";

import { useEffect, useRef, useState } from "react";
import type { Action } from "./state";
import type { UpdateAction } from "./state/layout";

type StartState = {
  cx: number;
  cy: number;
  startPointerAngle: number; // degrees
  startValueAngle: number; // degrees
} | null;

function parseRotate(styles?: string): number {
  if (!styles) return 0;
  try {
    const obj = JSON.parse(String(styles));
    const val = obj?.effects?.transformRotate as string | undefined;
    if (!val) return 0;
    const s = String(val).trim();
    if (s.endsWith("deg")) return parseFloat(s.slice(0, -3)) || 0;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function setRotate(styles: string | undefined, angleDeg: number): string {
  let obj: Record<string, unknown> = {};
  try {
    obj = styles ? JSON.parse(String(styles)) : {};
  } catch {
    obj = {};
  }
  const effects = (obj.effects as Record<string, unknown> | undefined) ?? {};
  effects.transformRotate = `${Math.round(angleDeg)}deg`;
  (obj as Record<string, unknown>).effects = effects;
  return JSON.stringify(obj);
}

export default function useCanvasRotate({
  componentId,
  styles,
  dispatch,
  containerRef,
  zoom = 1,
}: {
  componentId: string;
  styles?: string;
  dispatch: React.Dispatch<Action>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom?: number;
}) {
  const startRef = useRef<StartState>(null);
  const [rotating, setRotating] = useState(false);
  const [angle, setAngle] = useState(0);
  const captureRef = useRef<{ el: Element | null; id: number | null }>({ el: null, id: null });

  useEffect(() => {
    if (!rotating) return;
    const onMove = (e: PointerEvent) => {
      if (!startRef.current) return;
      const { cx, cy, startPointerAngle, startValueAngle } = startRef.current;
      const dx = (e.clientX - cx) / Math.max(zoom, 0.0001);
      const dy = (e.clientY - cy) / Math.max(zoom, 0.0001);
      const a = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
      let next = a - startPointerAngle + startValueAngle;
      // Normalize to -180..180 for readability
      while (next > 180) next -= 360;
      while (next < -180) next += 360;
      // Default: snap to 15deg; Shift disables snapping
      const snap = !e.shiftKey;
      const snapped = snap ? Math.round(next / 15) * 15 : next;
      setAngle(snapped);
      dispatch({
        type: "update",
        id: componentId,
        patch: { styles: setRotate(styles, snapped) },
      } as UpdateAction);
    };
    const onUp = () => {
      setRotating(false);
      try {
        if (captureRef.current?.el && captureRef.current?.id != null) {
          (captureRef.current.el as unknown as { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(captureRef.current.id);
        }
      } catch {}
      captureRef.current = { el: null, id: null };
      startRef.current = null;
    };
    const onKey = (ke: KeyboardEvent) => { if (ke.key === 'Escape') onUp(); };
    try { window.addEventListener("pointermove", onMove as unknown as EventListener, { passive: true }); } catch { window.addEventListener("pointermove", onMove as unknown as EventListener); }
    window.addEventListener("pointerup", onUp, { once: true });
    window.addEventListener("blur", onUp, { once: true });
    window.addEventListener("keydown", onKey);
    return () => {
      try { window.removeEventListener("pointermove", onMove as unknown as EventListener); } catch {}
      try { window.removeEventListener("pointerup", onUp as EventListener); } catch {}
      try { window.removeEventListener("blur", onUp as EventListener); } catch {}
      window.removeEventListener("keydown", onKey);
    };
  }, [rotating, componentId, dispatch, styles, zoom]);

  const startRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / Math.max(zoom, 0.0001);
    const dy = (e.clientY - cy) / Math.max(zoom, 0.0001);
    const startPointerAngle = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
    const startValueAngle = parseRotate(styles);
    startRef.current = {
      cx,
      cy,
      startPointerAngle,
      startValueAngle,
    } as StartState;
    try {
      (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
      captureRef.current = { el: e.target as Element, id: e.pointerId };
    } catch {}
    setAngle(startValueAngle);
    setRotating(true);
  };

  return { startRotate, rotating, angle } as const;
}
