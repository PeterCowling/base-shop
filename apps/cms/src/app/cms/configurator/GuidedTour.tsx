/* eslint-disable ds/no-nonlayered-zindex -- CMS-2651: onboarding overlay uses viewport-fixed layers and highlight ring; safe editor-only surface */
"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useTranslations } from "@acme/i18n";

interface Step {
  selector: string;
  content: React.ReactNode;
}

const TOUR_KEY = "configurator-guided-tour";

// Steps are created inside the component to allow i18n via t()

interface GuidedTourContextValue {
  replay: () => void;
}

const GuidedTourContext = createContext<GuidedTourContextValue>({
  replay: () => {},
});

export function useGuidedTour(): GuidedTourContextValue {
  return useContext(GuidedTourContext);
}

export default function GuidedTour({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const t = useTranslations();

  const steps: Step[] = [
    {
      selector: '[data-tour="select-template"]', // i18n-exempt -- CMS-2651 [ttl=2026-12-31]
      content: t("cms.configurator.tour.selectTemplate"),
    },
    {
      selector: '[data-tour=\"drag-component\"]', // i18n-exempt -- CMS-2651 [ttl=2026-12-31]
      content: t("cms.configurator.tour.dragComponent"),
    },
    {
      selector: '[data-tour=\"edit-properties\"]', // i18n-exempt -- CMS-2651 [ttl=2026-12-31]
      content: t("cms.configurator.tour.editProperties"),
    },
    {
      selector: '[data-tour=\"preview\"]', // i18n-exempt -- CMS-2651 [ttl=2026-12-31]
      content: t("cms.configurator.tour.preview"),
    },
    {
      selector: '[data-tour=\"publish\"]', // i18n-exempt -- CMS-2651 [ttl=2026-12-31]
      content: t("cms.configurator.tour.publish"),
    },
  ];
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const persist = useCallback((idx: number | null) => {
    if (typeof window !== "undefined") {
      if (idx === null) {
        localStorage.setItem(TOUR_KEY, "done");
      } else {
        localStorage.setItem(TOUR_KEY, String(idx));
      }
    }
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    persist(0);
  }, [persist]);

  const replay = useCallback(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(TOUR_KEY);
    if (!stored) {
      start();
    } else if (stored !== "done") {
      const idx = parseInt(stored, 10);
      if (!Number.isNaN(idx)) {
        setStepIndex(idx);
      }
    }
  }, [start]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i === null) return i;
      const nextIdx = i + 1;
      if (nextIdx >= steps.length) {
        persist(null);
        return null;
      }
      persist(nextIdx);
      return nextIdx;
    });
  }, [persist, steps.length]);

  const back = useCallback(() => {
    setStepIndex((i) => {
      if (i === null) return i;
      const prevIdx = Math.max(i - 1, 0);
      persist(prevIdx);
      return prevIdx;
    });
  }, [persist]);

  const skip = useCallback(() => {
    persist(null);
    setStepIndex(null);
  }, [persist]);

  const finish = useCallback(() => {
    persist(null);
    setStepIndex(null);
  }, [persist]);

  const current = stepIndex !== null ? steps[stepIndex] : null;

  useEffect(() => {
    if (!current) return;
    const el = document.querySelector(current.selector) as HTMLElement | null;
    if (!el) {
      next();
      return;
    }

    const update = () => {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [current, next]);

  return (
    <GuidedTourContext.Provider value={{ replay }}>
      <div className="relative">
        {children}
        {current && coords && (
          <>
            <div className="pointer-events-none fixed inset-0 z-40">
              <div
                className="absolute top-0 start-0 end-0 bg-foreground/50"
                style={{ height: coords.top }}
              />
              <div
                className="absolute start-0 bg-foreground/50"
                style={{
                  top: coords.top,
                  width: coords.left,
                  height: coords.height,
                }}
              />
              <div
                className="absolute end-0 bg-foreground/50"
                style={{
                  top: coords.top,
                  left: coords.left + coords.width,
                  height: coords.height,
                }}
              />
              <div
                className="absolute start-0 end-0 bg-foreground/50"
                style={{ top: coords.top + coords.height, bottom: 0 }}
              />
            </div>
            <div
              className="pointer-events-none fixed z-50 rounded"
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                height: coords.height,
                animation: "tour-pulse 2s infinite", // i18n-exempt -- CMS-2651 [ttl=2026-12-31]
                boxShadow: "0 0 0 3px hsl(var(--color-primary) / 0.9)", // i18n-exempt -- CMS-2651 [ttl=2026-12-31]
              }}
            />
            <div
              className="bg-primary text-primary-foreground fixed z-50 rounded p-4 shadow"
              style={{ top: coords.top + coords.height + 8, left: coords.left }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>{current.content}</div>
                <div className="text-sm">
                  {t("pb.tour.stepXofY", { current: stepIndex! + 1, total: steps.length })}
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-sm">
                <button
                  className="underline disabled:opacity-50 inline-flex items-center justify-center min-h-11 min-w-11 px-3"
                  onClick={back}
                  disabled={stepIndex === 0}
                >
                  {t("pb.tour.back")}
                </button>
                <button
                  className="underline inline-flex items-center justify-center min-h-11 min-w-11 px-3"
                  onClick={skip}
                >
                  {t("pb.tour.skip")}
                </button>
                {stepIndex === steps.length - 1 ? (
                  <button
                    className="underline inline-flex items-center justify-center min-h-11 min-w-11 px-3"
                    onClick={finish}
                  >
                    {t("pb.tour.done")}
                  </button>
                ) : (
                  <button
                    className="underline inline-flex items-center justify-center min-h-11 min-w-11 px-3"
                    onClick={next}
                  >
                    {t("pb.tour.next")}
                  </button>
                )}
              </div>
            </div>
            <style>{`@keyframes tour-pulse{0%{box-shadow:0 0 0 0 hsl(var(--color-primary) / 0.9);}70%{box-shadow:0 0 0 8px hsl(var(--color-primary) / 0);}100%{box-shadow:0 0 0 0 hsl(var(--color-primary) / 0);}}`}</style>
          </>
        )}
      </div>
    </GuidedTourContext.Provider>
  );
}
