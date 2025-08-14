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

  const start = useCallback(() => {
    setStepIndex(0);
  }, []);

  const replay = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOUR_KEY);
    }
    start();
  }, [start]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(TOUR_KEY)) {
      start();
    }
  }, [start]);

  const current = stepIndex !== null ? steps[stepIndex] : null;

  useEffect(() => {
    if (!current) return;
    const el = document.querySelector(current.selector) as HTMLElement | null;
    if (!el) {
      setStepIndex((i) => (i === null ? i : i + 1));
      return;
    }
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left });
  }, [current]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i === null) return i;
      if (i + 1 >= steps.length) {
        if (typeof window !== "undefined") {
          localStorage.setItem(TOUR_KEY, "done");
        }
        return null;
      }
      return i + 1;
    });
  }, []);

  return (
    <GuidedTourContext.Provider value={{ replay }}>
      {children}
      {current && coords && (
        <div
          className="fixed z-50 rounded bg-primary p-4 text-primary-foreground shadow"
          style={{ top: coords.top, left: coords.left }}
        >
          <div>{current.content}</div>
          <button className="mt-2 text-sm underline" onClick={next}>
            {stepIndex === steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      )}
    </GuidedTourContext.Provider>
  );
}
