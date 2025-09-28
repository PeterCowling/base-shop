/* eslint-disable ds/no-nonlayered-zindex -- PB-000: Guided tour overlay needs custom layering without DS layered components */
"use client";
import { useTranslations } from "@acme/i18n";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface Step {
  target: string;
  content: string;
}

export const STATUS = {
  FINISHED: "finished",
  SKIPPED: "skipped",
} as const;

export interface CallBackProps {
  status: (typeof STATUS)[keyof typeof STATUS];
}

interface PageBuilderTourProps {
  steps: Step[];
  run: boolean;
  callback: (data: CallBackProps) => void;
}

type Rect = { top: number; left: number; width: number; height: number } | null;

function useStepTargetRect(step: Step | null) {
  const [rect, setRect] = useState<Rect>(null);
  const rafRef = useRef<number | null>(null);

  const compute = useCallback(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useLayoutEffect(() => {
    compute();
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(compute);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [compute]);

  // Try to scroll the element into view when step changes
  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }
  }, [step]);

  return rect;
}

export default function PageBuilderTour({ steps, run, callback }: PageBuilderTourProps) {
  const t = useTranslations() as unknown as (key: string, vars?: Record<string, unknown>) => string;
  const [active, setActive] = useState(0);
  const currentStep = useMemo(() => (run ? steps[active] ?? null : null), [run, steps, active]);
  const rect = useStepTargetRect(currentStep);

  // Start/reset when run toggles on
  useEffect(() => {
    if (run) setActive(0);
  }, [run]);

  const finish = useCallback(() => callback({ status: STATUS.FINISHED }), [callback]);
  const skip = useCallback(() => callback({ status: STATUS.SKIPPED }), [callback]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!run) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        setActive((i) => (i + 1 < steps.length ? i + 1 : i));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((i) => (i - 1 >= 0 ? i - 1 : i));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run, steps.length, skip]);

  if (!run) return null;

  // If target missing, render a minimal overlay prompting to continue or skip
  const missingTarget = !rect;

  // Compute tooltip position (top/left/width applied inline to a single node)
  let tipStyle: React.CSSProperties = {};
  if (rect) {
    const margin = 8;
    const belowSpace = window.innerHeight - (rect.top + rect.height);
    const aboveSpace = rect.top;
    const placeBelow = belowSpace >= 140 || belowSpace >= aboveSpace; // heuristic
    const top = placeBelow ? rect.top + rect.height + margin : Math.max(8, rect.top - 120 - margin);
    const left = Math.min(
      Math.max(8, rect.left + rect.width / 2 - 180),
      window.innerWidth - 8 - 360
    );
    tipStyle = { top, left, width: 360 };
  } else {
    tipStyle = { top: 40, left: 40, width: 360 };
  }

  return (
    <div role="dialog" aria-modal="true" className="relative fixed inset-0 z-50 pointer-events-auto">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/45 cursor-pointer"
        role="button"
        aria-label={t("pb.tour.skipAria")}
        tabIndex={0}
        onClick={skip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault();
            skip();
          }
        }}
      />

      {/* Highlight box over target */}
      {rect && (
        <>
          {/* PB-2419: dynamic geometry for highlight overlay */}
          {/* eslint-disable react/forbid-dom-props -- PB-2419: highlight overlay requires dynamic geometry */}
          <div
            aria-hidden
            style={{
              position: "fixed",
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              borderRadius: 8,
              boxShadow: "0 0 0 3px var(--color-bg), 0 0 0 9999px rgba(0,0,0,0.45)",
              pointerEvents: "none",
              // i18n-exempt -- PB-2419 transition CSS string, not user copy
              transition: "top 0.1s, left 0.1s, width 0.1s, height 0.1s",
            }}
          />
          {/* eslint-enable react/forbid-dom-props */}
        </>
      )}

      {/* Tooltip card */}
      {/* eslint-disable react/forbid-dom-props -- PB-2419: dynamic top/left/width positioning */}
      <div className="fixed z-50 rounded-lg border border-white/20 bg-surface-1 text-foreground shadow-xl p-3" style={tipStyle}>
        <div className="font-semibold mb-2">
          {t("pb.tour.stepXofY", { current: Math.min(active + 1, steps.length), total: steps.length })}
        </div>
        <div className="mb-3">
          {missingTarget ? (
            <span>{t("pb.tour.preparing")}</span>
          ) : (
            <span>{currentStep?.content}</span>
          )}
        </div>
        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={skip}
            className="bg-transparent text-muted-foreground border-0 px-3 py-2 cursor-pointer min-h-10 min-w-10"
          >
            {t("pb.tour.skip")}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActive((i) => Math.max(0, i - 1))}
              disabled={active === 0}
              className="bg-surface-2 text-foreground border border-border px-3 py-2 rounded-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer min-h-10 min-w-10"
            >
              {t("pb.tour.back")}
            </button>
            {active + 1 < steps.length ? (
              <button
                type="button"
                onClick={() => setActive((i) => Math.min(steps.length - 1, i + 1))}
                className="bg-primary text-foreground border border-primary px-3 py-2 rounded-md cursor-pointer min-h-10 min-w-10"
              >
                {t("pb.tour.next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="bg-primary text-foreground border border-primary px-3 py-2 rounded-md cursor-pointer min-h-10 min-w-10"
              >
                {t("pb.tour.done")}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* eslint-enable react/forbid-dom-props */}
    </div>
  );
}
