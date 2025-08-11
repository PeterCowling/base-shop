// apps/cms/src/app/cms/wizard/hooks/useWizardPersistence.ts
"use client";

import { useEffect } from "react";
import { wizardStateSchema, type WizardState } from "../schema";

/** Key used to mirror wizard progress in localStorage for preview components. */
export const STORAGE_KEY = "cms-wizard-progress";

/** Clears persisted wizard progress on the server and localStorage. */
export async function resetWizardProgress(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    try {
      await fetch("/cms/api/wizard-progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: null, data: {}, completed: {} }),
      });
    } catch {
      /* ignore network errors */
    }
  }
}

/**
 * Loads wizard state from the server and saves it back whenever the state
 * changes. A copy is mirrored to localStorage so the live preview can read it.
 */
export function useWizardPersistence(
  state: WizardState,
  setState: (s: WizardState) => void,
  onInvalid?: () => void
): (stepId: string, status: boolean) => void {
  /* Load persisted state on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        const parsed = wizardStateSchema.safeParse({
          ...(json.state ?? json),
          completed: json.completed ?? {},
        });
        if (parsed.success) {
          setState(parsed.data);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
            window.dispatchEvent(new CustomEvent("wizard:update"));
          } catch {
            /* ignore */
          }
        } else {
          resetWizardProgress();
          onInvalid?.();
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, [setState]);

  /* Persist whenever the state changes */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent("wizard:update"));
    } catch {
      /* ignore quota */
    }
    const { completed, ...data } = state;
    fetch("/cms/api/wizard-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId: "wizard", data }),
    }).catch(() => {
      /* ignore network errors */
    });
  }, [state]);

  /* Expose completion helper */
  const markStepComplete = (stepId: string, status: boolean) => {
    let updated: WizardState | null = null;
    setState((prev) => {
      updated = {
        ...prev,
        completed: { ...prev.completed, [stepId]: status },
      };
      return updated;
    });
    if (typeof window !== "undefined" && updated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("wizard:update"));
      } catch {
        /* ignore quota */
      }
      fetch("/cms/api/wizard-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, completed: status }),
      }).catch(() => {
        /* ignore network errors */
      });
    }
  };

  return markStepComplete;
}
