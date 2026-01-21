"use client";

/* eslint-disable react/forbid-dom-props -- PB-2419: PB-DEVTOOLS dynamic overlay positioning requires inline styles (left/top/width/height). Dev-only, safe. */
import React, { useEffect, useRef, useState } from "react";

import { useTranslations } from "@acme/i18n";

import { AUTOSCROLL_EDGE_PX } from "../hooks/usePageBuilderDnD";

type Props = {
  /** Optional scroll container to draw autoscroll thresholds. If omitted, tries to infer. */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
};

type Box = { left: number; top: number; width: number; height: number };

function getCanvas(): HTMLElement | null {
  try { return document.getElementById("canvas"); } catch { return null; }
}

function measure(el: HTMLElement, relativeTo?: DOMRect): Box {
  const r = el.getBoundingClientRect();
  if (!relativeTo) return { left: r.left, top: r.top, width: r.width, height: r.height };
  return { left: r.left - relativeTo.left, top: r.top - relativeTo.top, width: r.width, height: r.height };
}

export default function DevToolsOverlay({ scrollRef }: Props) {
  const t = useTranslations();
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("pb:devtools") === "1"; } catch { return false; }
  });
  const [fps, setFps] = useState<number>(0);
  const [droppables, setDroppables] = useState<Box[]>([]);
  const [items, setItems] = useState<Box[]>([]);
  const [scrollBands, setScrollBands] = useState<{ top?: Box; bottom?: Box; left?: Box; right?: Box }>({});
  const loopRef = useRef<number | null>(null);
  const lastRef = useRef<number>(Date.now());

  // Keyboard toggle: Ctrl/Cmd + Alt + D
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.altKey && (e.ctrlKey || e.metaKey))) return;
      if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        setEnabled((v) => {
          const next = !v;
          try { localStorage.setItem("pb:devtools", next ? "1" : "0"); } catch {}
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // FPS and sampling of boxes
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const now = Date.now();
      const dt = now - lastRef.current;
      lastRef.current = now;
      const curr = dt > 0 ? Math.round(1000 / dt) : 0;
      setFps((p) => (p * 0.8 + curr * 0.2));
      // Sample boxes
      const canvas = getCanvas();
      const baseRect = canvas?.getBoundingClientRect();
      try {
        const d: Box[] = [];
        document.querySelectorAll<HTMLElement>(/* i18n-exempt -- PB-2419: CSS selector */ '[id^="container-"]').forEach((el) => {
          if (!baseRect) return; d.push(measure(el, baseRect));
        });
        setDroppables(d);
      } catch {}
      try {
        const i: Box[] = [];
        document.querySelectorAll<HTMLElement>('[data-component-id]').forEach((el) => {
          if (!baseRect) return; i.push(measure(el, baseRect));
        });
        setItems(i);
      } catch {}
      // Scroll thresholds
      try {
        const sc = scrollRef?.current ?? canvas?.closest('.overscroll-contain') ?? null;
        if (sc) {
          const r = sc.getBoundingClientRect();
          const band = AUTOSCROLL_EDGE_PX;
          setScrollBands({
            top: { left: 0, top: 0, width: r.width, height: band },
            bottom: { left: 0, top: r.height - band, width: r.width, height: band },
            left: { left: 0, top: 0, width: band, height: r.height },
            right: { left: r.width - band, top: 0, width: band, height: r.height },
          });
        } else {
          setScrollBands({});
        }
      } catch {}
      loopRef.current = requestAnimationFrame(tick);
    };
    loopRef.current = requestAnimationFrame(tick);
    return () => { if (loopRef.current) cancelAnimationFrame(loopRef.current); };
  }, [enabled, scrollRef]);

  const canvas = getCanvas();
  const baseRect = canvas?.getBoundingClientRect();

  if (!enabled || !canvas || !baseRect) return null;

  return (
    <div className="relative pointer-events-none" aria-hidden>
      <div className="absolute inset-0">
      {/* Droppable containers */}
      {droppables.map((b) => (
        <div
          key={`drop-${b.left}-${b.top}-${b.width}-${b.height}`}
          className="absolute border border-primary/60"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
      {/* Items */}
      {items.map((b) => (
        <div
          key={`item-${b.left}-${b.top}-${b.width}-${b.height}`}
          className="absolute border border-primary/60"
          style={{ left: b.left, top: b.top, width: b.width, height: b.height }}
        />
      ))}
      {/* HUD */}
      <div className="absolute start-2 top-2 rounded bg-foreground/70 px-2 py-1 text-xs text-foreground shadow">
        {/* i18n-exempt: developer-only diagnostics UI */}
        <div>DevTools ON</div>
        {/* i18n-exempt: developer-only diagnostics UI */}
        <div>FPS ~ {Math.round(fps)}</div>
        {/* i18n-exempt: developer-only diagnostics UI */}
        <div>Droppables: {droppables.length} Items: {items.length}</div>
        {/* i18n-exempt: developer-only diagnostics UI */}
        <div>{t("pb.devtools.toggleHint")}</div>
      </div>
      {/* Autoscroll bands (relative to scroll container) */}
      {(() => {
        const sc = scrollRef?.current ?? canvas.closest('.overscroll-contain');
        if (!sc) return null;
        const r = sc.getBoundingClientRect();
        const s = scrollBands;
        return (
          <div
            className="pointer-events-none absolute"
            style={{ left: r.left - baseRect.left, top: r.top - baseRect.top, width: r.width, height: r.height }}
          >
            {s.top && (
              <div
                className="absolute bg-primary/10"
                style={{ left: s.top.left, top: s.top.top, width: s.top.width, height: s.top.height }}
              />
            )}
            {s.bottom && (
              <div
                className="absolute bg-primary/10"
                style={{ left: s.bottom.left, top: s.bottom.top, width: s.bottom.width, height: s.bottom.height }}
              />
            )}
            {s.left && (
              <div
                className="absolute bg-primary/10"
                style={{ left: s.left.left, top: s.left.top, width: s.left.width, height: s.left.height }}
              />
            )}
            {s.right && (
              <div
                className="absolute bg-primary/10"
                style={{ left: s.right.left, top: s.right.top, width: s.right.width, height: s.right.height }}
              />
            )}
          </div>
        );
      })()}
      </div>
    </div>
  );
}
