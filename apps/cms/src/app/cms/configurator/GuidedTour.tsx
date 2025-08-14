"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface Step {
  selector: string;
  content: React.ReactNode;
}

const TOUR_KEY = "configurator-guided-tour";

const steps: Step[] = [
  {
    selector: '[data-tour="select-template"]',
    content: "Start by selecting a template for your page.",
  },
  {
    selector: '[data-tour="drag-component"]',
    content: "Drag components from the palette into the page.",
  },
  {
    selector: '[data-tour="edit-properties"]',
    content: "Edit the selected component's properties here.",
  },
  {
    selector: '[data-tour="preview"]',
    content: "Preview your page to see how it looks.",
  },
  {
    selector: '[data-tour="publish"]',
    content: "Publish your work when you're ready.",
  },
];

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
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

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
  }, [persist]);

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
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left });
  }, [current, next]);

  return (
    <GuidedTourContext.Provider value={{ replay }}>
      {children}
      {current && coords && (
        <div
          className="fixed z-50 rounded bg-primary p-4 text-primary-foreground shadow"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>{current.content}</div>
            <div className="text-sm">
              Step {stepIndex! + 1} of {steps.length}
            </div>
          </div>
          <div className="mt-2 flex gap-2 text-sm">
            <button
              className="underline disabled:opacity-50"
              onClick={back}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            <button className="underline" onClick={skip}>
              Skip
            </button>
            {stepIndex === steps.length - 1 ? (
              <button className="underline" onClick={finish}>
                Finish
              </button>
            ) : (
              <button className="underline" onClick={next}>
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </GuidedTourContext.Provider>
  );
}
