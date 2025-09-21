"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export type FocalPoint = { x: number; y: number }; // normalized 0..1

interface Props {
  value?: FocalPoint;
  onChange: (next: FocalPoint) => void;
  visible?: boolean;
  disabled?: boolean;
}

export default function ImageFocalOverlay({ value, onChange, visible = false, disabled = false }: Props) {
  const [dragging, setDragging] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const toNormalized = useCallback((clientX: number, clientY: number): FocalPoint | null => {
    const el = overlayRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    const fp = toNormalized(e.clientX, e.clientY);
    if (fp) onChange(fp);
  }, [disabled, toNormalized, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const fp = toNormalized(e.clientX, e.clientY);
    if (fp) onChange(fp);
  }, [dragging, disabled, toNormalized, onChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    e.preventDefault();
    e.stopPropagation();
    try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
    setDragging(false);
  }, [dragging]);

  // Keyboard micro-adjustment for accessibility
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const onKey = (ev: KeyboardEvent) => {
      if (disabled || !visible) return;
      const key = ev.key.toLowerCase();
      if (!["arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)) return;
      ev.preventDefault();
      const step = ev.shiftKey ? 0.05 : 0.01;
      const v = value ?? { x: 0.5, y: 0.5 };
      const next: FocalPoint = {
        x: Math.min(1, Math.max(0, v.x + (key === "arrowleft" ? -step : key === "arrowright" ? step : 0))),
        y: Math.min(1, Math.max(0, v.y + (key === "arrowup" ? -step : key === "arrowdown" ? step : 0))),
      };
      onChange(next);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [value, visible, disabled, onChange]);

  const fp = value ?? { x: 0.5, y: 0.5 };

  if (!visible) return null;
  return (
    <div
      ref={overlayRef}
      role="slider"
      aria-label="Image focal point"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round((fp.x + fp.y) * 50)}
      tabIndex={0}
      className="pointer-events-auto absolute inset-0 z-40 select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* crosshair */}
      <div
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 transform rounded-full border-2 border-white bg-primary shadow outline-none"
        style={{ left: `${(fp.x * 100).toFixed(2)}%`, top: `${(fp.y * 100).toFixed(2)}%` }}
        aria-hidden
      />
      {/* helper text */}
      <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white shadow dark:bg-white/70 dark:text-black">
        Drag to set focal point
      </div>
    </div>
  );
}
