"use client";

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

  // Compute tooltip position
  let tipStyle: React.CSSProperties = { position: "fixed", zIndex: 10001 };
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
    tipStyle = { ...tipStyle, top, left, width: 360 };
  } else {
    tipStyle = { ...tipStyle, top: 40, left: 40, width: 360 };
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "auto" }}
    >
      {/* Dimmed backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }}
        onClick={skip}
      />

      {/* Highlight box over target */}
      {rect && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius: 8,
            boxShadow: "0 0 0 3px #fff, 0 0 0 9999px rgba(0,0,0,0.45)",
            pointerEvents: "none",
            transition: "top 0.1s, left 0.1s, width 0.1s, height 0.1s",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={{
          ...tipStyle,
          background: "#111827",
          color: "#F9FAFB",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 8,
          padding: 12,
          boxShadow: "0 10px 20px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {`Step ${Math.min(active + 1, steps.length)} of ${steps.length}`}
        </div>
        <div style={{ marginBottom: 10 }}>
          {missingTarget ? (
            <span>
              Preparing this step… If it doesn’t appear, click Next.
            </span>
          ) : (
            <span>{currentStep?.content}</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <button
            type="button"
            onClick={skip}
            style={{
              background: "transparent",
              color: "#E5E7EB",
              border: "none",
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Skip
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setActive((i) => Math.max(0, i - 1))}
              disabled={active === 0}
              style={{
                background: "#374151",
                color: "#F9FAFB",
                border: "1px solid #4B5563",
                padding: "6px 12px",
                borderRadius: 6,
                cursor: active === 0 ? "not-allowed" : "pointer",
                opacity: active === 0 ? 0.6 : 1,
              }}
            >
              Back
            </button>
            {active + 1 < steps.length ? (
              <button
                type="button"
                onClick={() => setActive((i) => Math.min(steps.length - 1, i + 1))}
                style={{
                  background: "#2563EB",
                  color: "white",
                  border: "1px solid #1D4ED8",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                style={{
                  background: "#10B981",
                  color: "white",
                  border: "1px solid #059669",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
