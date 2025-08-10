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
        body: "{}",
      });
    } catch {
      /* ignore network errors */
    }
  }
}

/**
 * Loads wizard state from the server and saves it back whenever the step
 * changes. A copy is mirrored to localStorage so the live preview can read it.
 */
export function useWizardPersistence(
  state: WizardState,
  setState: (s: WizardState) => void,
  onInvalid?: () => void
): void {
  /* Load persisted state on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch("/cms/api/wizard-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        const parsed = wizardStateSchema.safeParse(json);
        if (parsed.success) {
          setState(parsed.data);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
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

  /* Persist whenever the step changes */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
    fetch("/cms/api/wizard-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {
      /* ignore network errors */
    });
  }, [state.step]);
}
