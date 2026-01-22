"use client";

import { useEffect, useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";

interface Props {
  show?: boolean;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  step?: number;
  /** Builder viewport (affects labels only) */
  viewport?: "desktop" | "tablet" | "mobile";
  /** Optional: when a Section is selected, its effective content width */
  contentWidth?: string | null;
  /** Optional: content alignment for safe zone positioning */
  contentAlign?: "left" | "center" | "right";
  /** Base content alignment (used to annotate if override is active) */
  contentAlignBase?: "left" | "center" | "right";
  /** Source of the effective alignment */
  contentAlignSource?: "base" | "desktop" | "tablet" | "mobile";
}

const DATA_CY_RULERS_OVERLAY = "pb-rulers-overlay";

export default function RulersOverlay({ show = false, canvasRef, step = 50, viewport, contentWidth, contentAlign = "center", contentAlignBase = "center", contentAlignSource = "base" }: Props) {
  const t = useTranslations();
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = canvasRef?.current;
    if (!el) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => update()) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); };
  }, [canvasRef]);

  const labelsX = useMemo(() => {
    const arr: number[] = [];
    if (!size.w) return arr;
    for (let x = step; x < size.w; x += step) arr.push(x);
    return arr;
  }, [size.w, step]);
  const labelsY = useMemo(() => {
    const arr: number[] = [];
    if (!size.h) return arr;
    for (let y = step; y < size.h; y += step) arr.push(y);
    return arr;
  }, [size.h, step]);

  const parsePx = (val?: string): number | null => {
    if (!val) return null;
    const s = String(val).trim();
    if (s.endsWith("px")) return parseFloat(s.slice(0, -2)) || 0;
    if (s.endsWith("%")) {
      const n = parseFloat(s.slice(0, -1)) || 0;
      return size.w > 0 ? (n / 100) * size.w : 0;
    }
    if (s.endsWith("rem")) {
      const n = parseFloat(s.slice(0, -3)) || 0;
      const base = typeof window !== "undefined" ? parseFloat(getComputedStyle(document.documentElement).fontSize || "16") || 16 : 16;
      return n * base;
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
  };

  const safeWidth = parsePx(contentWidth || undefined);
  const safeLeft = (() => {
    if (safeWidth == null || !Number.isFinite(safeWidth)) return null;
    if (contentAlign === "left") return 0;
    if (contentAlign === "right") return Math.max(0, size.w - safeWidth);
    return Math.max(0, (size.w - safeWidth) / 2);
  })();

  if (!show) return null;
  const major = "hsl(var(--color-border) / 0.35)", minor = "hsl(var(--color-border) / 0.2)";
  return (
    <div className="pointer-events-none relative inset-0" data-cy={DATA_CY_RULERS_OVERLAY}>
      <div className="absolute inset-0">
        { }
        <div
        aria-hidden
        className="absolute start-0 end-0 h-5"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, ${minor}, ${minor} 1px, transparent 1px, transparent 10px), repeating-linear-gradient(to right, ${major}, ${major} 1px, transparent 1px, transparent 50px)`,
        }}
        />
        { }
        { }
        <div
        aria-hidden
        className="absolute top-0 bottom-0 w-5"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, ${minor}, ${minor} 1px, transparent 1px, transparent 10px), repeating-linear-gradient(to bottom, ${major}, ${major} 1px, transparent 1px, transparent 50px)`,
        }}
        />
        { }
      {/* Label every 100px */}
        {labelsX.map((x) => (
           
          <div key={`lx-${x}`} className="absolute top-0 text-xs text-muted-foreground" style={{ left: x + 2 }}>
            {x}
          </div>
        ))}
        {labelsY.map((y) => (
           
          <div key={`ly-${y}`} className="absolute start-0 text-xs text-muted-foreground" style={{ top: y + 2 }}>
            {y}
          </div>
        ))}
        {safeWidth != null && safeLeft != null && safeWidth > 0 && (
          <div aria-hidden className="absolute inset-y-0">
            {/* Unsafe zones tint */}
            { }
            <div className="bg-destructive/100/5 absolute inset-y-0 start-0" style={{ width: Math.max(0, safeLeft) }} />
            { }
            <div className="bg-destructive/100/5 absolute inset-y-0 end-0" style={{ width: Math.max(0, size.w - (safeLeft + safeWidth)) }} />
            {/* Safe zone */}
            <div
              className="bg-primary/5 absolute inset-y-0 border-x border-primary/40"
               
              style={{ left: safeLeft, width: safeWidth }}
            />
            <div
              className="absolute top-2 start-1/2 -translate-x-1/2 rounded bg-foreground/60 px-2 py-0.5 text-xs text-foreground shadow dark:bg-card/70 dark:text-foreground opacity-100"
            >
              {(() => {
                const viewportPrefix = viewport === "desktop"
                  ? String(t("cms.builder.rulers.viewport.desktop"))
                  : viewport === "tablet"
                    ? String(t("cms.builder.rulers.viewport.tablet"))
                    : viewport === "mobile"
                      ? String(t("cms.builder.rulers.viewport.mobile"))
                      : "";
                const alignLabel = contentAlign === "left"
                  ? String(t("cms.builder.align.left"))
                  : contentAlign === "right"
                    ? String(t("cms.builder.align.right"))
                    : String(t("cms.builder.align.center"));
                const sourceLabel = contentAlignSource === "desktop"
                  ? String(t("cms.builder.source.desktop"))
                  : contentAlignSource === "tablet"
                    ? String(t("cms.builder.source.tablet"))
                    : contentAlignSource === "mobile"
                      ? String(t("cms.builder.source.mobile"))
                      : String(t("cms.builder.source.base"));
                const baseSuffix = contentAlignSource !== "base" && contentAlignBase
                  ? `, ${t("cms.builder.rulers.basePrefix")} ${t(`cms.builder.align.${contentAlignBase}`)}`
                  : "";
                return t("cms.builder.rulers.safeInfo", {
                  viewport: viewportPrefix,
                  width: Math.round(safeWidth),
                  align: alignLabel,
                  source: sourceLabel,
                  baseSuffix,
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
