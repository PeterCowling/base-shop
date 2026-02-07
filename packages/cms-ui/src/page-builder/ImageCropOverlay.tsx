"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTranslations } from "@acme/i18n";

function parseAspect(aspect?: string): number | undefined {
  if (!aspect) return undefined;
  const [w, h] = String(aspect).split(":").map((n) => Number(n));
  if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return undefined;
  return w / h;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a), y = Math.abs(b);
  while (y) {
    const t = y; y = x % y; x = t;
  }
  return x || 1;
}

function toAspectString(ratio: number, max = 100): string {
  // crude but robust: sweep denominators 1..max, pick best integer numerator
  let best = { err: Number.POSITIVE_INFINITY, w: 1, h: 1 };
  for (let h = 1; h <= max; h++) {
    const w = Math.max(1, Math.round(ratio * h));
    const err = Math.abs(ratio - w / h);
    if (err < best.err) best = { err, w, h };
  }
  const d = gcd(best.w, best.h);
  return `${Math.max(1, Math.round(best.w / d))}:${Math.max(1, Math.round(best.h / d))}`;
}

export default function ImageCropOverlay({ value, onChange, visible = false }: { value?: string; onChange: (next?: string) => void; visible?: boolean }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number }>({ w: 100, h: 100 });
  const [dragging, setDragging] = useState<null | "e" | "s" | "se">(null);
  const t = useTranslations();

  const targetRatio = useMemo(() => parseAspect(value), [value]);

  // Initialize to current aspect centered within parent
  useEffect(() => {
    if (!visible) return;
    const el = wrapRef.current?.parentElement as HTMLElement | null;
    if (!el) return;
    const W = el.clientWidth || 0;
    const H = el.clientHeight || 0;
    if (W <= 0 || H <= 0) return;
    const r = targetRatio ?? W / Math.max(1, H);
    const w = Math.min(W, Math.max(40, Math.round(Math.min(W, H * r))));
    const h = Math.max(40, Math.round(w / Math.max(0.01, r)));
    setBox({ w, h });
  }, [targetRatio, visible]);

  const commit = useCallback((w: number, h: number) => {
    const ratio = Math.max(0.01, w / Math.max(1, h));
    onChange(toAspectString(ratio));
  }, [onChange]);

  const start = useCallback((e: React.PointerEvent, mode: "e" | "s" | "se") => {
    e.preventDefault();
    e.stopPropagation();
    const root = wrapRef.current?.parentElement as HTMLElement | null;
    if (!root) return;
    const W = root.clientWidth || 0;
    const H = root.clientHeight || 0;
    const startX = e.clientX;
    const startY = e.clientY;
    const init = { ...box };
    setDragging(mode);
    const lockedRatio = init.w / Math.max(1, init.h);
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const shift = !!ev.shiftKey; // hold Shift to lock current ratio
      let w = init.w, h = init.h;
      if (mode === "e" || mode === "se") w = Math.min(W, Math.max(40, init.w + dx));
      if (mode === "s" || mode === "se") h = Math.min(H, Math.max(40, init.h + dy));
      if (shift) {
        if (mode === "e") h = Math.max(40, Math.min(H, Math.round(w / Math.max(0.01, lockedRatio))));
        else if (mode === "s") w = Math.max(40, Math.min(W, Math.round(h * lockedRatio)));
        else {
          // diagonal: prefer width change, derive height
          h = Math.max(40, Math.min(H, Math.round(w / Math.max(0.01, lockedRatio))));
        }
      }
      setBox({ w, h });
      commit(w, h);
    };
    const onUp = () => {
      setDragging(null);
      try { window.removeEventListener("pointermove", onMove as unknown as EventListener); } catch {}
      try { window.removeEventListener("pointerup", onUp as unknown as EventListener); } catch {}
    };
    window.addEventListener("pointermove", onMove as unknown as EventListener);
    window.addEventListener("pointerup", onUp as unknown as EventListener, { once: true } as AddEventListenerOptions);
  }, [box, commit]);

  if (!visible) return null;
  const el = wrapRef.current?.parentElement as HTMLElement | null;
  const W = el?.clientWidth || 0, H = el?.clientHeight || 0;
  const left = Math.max(0, Math.round((W - box.w) / 2));
  const top = Math.max(0, Math.round((H - box.h) / 2));

  return (
     
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 select-none">
      {/* Dim entire canvas region rather than using a raw shadow ring (DS tokenized color) */}
      <div className="absolute inset-0 bg-foreground/35" aria-hidden="true" />
      {/* Crop rectangle (centered) */}
      <div
        className="absolute border-2 border-primary/90"
         
        style={{ left, top, width: box.w, height: box.h }}
      >
        {/* Handles */}
        <div
          className="pointer-events-auto absolute -end-1 top-1/2 h-2 w-2 -translate-y-1/2 cursor-ew-resize rounded bg-primary"
          onPointerDown={(e) => start(e, "e")}
          title={String(t("cms.builder.crop.dragHoriz"))}
        />
        <div
          className="pointer-events-auto absolute start-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 cursor-ns-resize rounded bg-primary"
          onPointerDown={(e) => start(e, "s")}
          title={String(t("cms.builder.crop.dragVert"))}
        />
        <div
          className="pointer-events-auto absolute -end-1 -bottom-1 h-3 w-3 cursor-nwse-resize rounded bg-secondary"
          onPointerDown={(e) => start(e, "se")}
          title={String(t("cms.builder.crop.dragAny"))}
        />
        {/* Badge */}
        <div className="pointer-events-none absolute -top-5 start-0 flex items-center gap-1">
          <div className="pointer-events-none rounded bg-foreground/70 px-1 text-xs text-foreground shadow dark:bg-card/70 dark:text-foreground">
            {toAspectString(Math.max(0.01, box.w / Math.max(1, box.h)))}{dragging ? t("cms.builder.crop.draggingSuffix") : ""}
          </div>
          <button
            type="button"
            className="pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-foreground/60 px-1 text-xs text-foreground shadow hover:bg-foreground/70 dark:bg-card/70 dark:text-foreground dark:hover:bg-card"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(undefined); }}
            title={String(t("cms.builder.crop.resetTitle"))}
          >
            {t("actions.reset")}
          </button>
          <div className="pointer-events-none rounded bg-foreground/50 px-1 text-xs text-foreground dark:bg-card/60 dark:text-foreground">{t("cms.builder.crop.shiftLock")}</div>
        </div>
      </div>
    </div>
     
  );
}
