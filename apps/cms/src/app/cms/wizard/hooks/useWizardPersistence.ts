// apps/cms/src/app/cms/wizard/hooks/useWizardPersistence.ts
"use client";

import { useEffect } from "react";
import { wizardStateSchema, type WizardState } from "../schema";

/** Key used to persist wizard progress in localStorage. */
export const STORAGE_KEY = "cms-wizard-progress";

/** Removes any persisted wizard progress from localStorage. */
export function resetWizardProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Handles loading & persisting wizard state to localStorage.
 *
 * @param state - Current wizard state
 * @param setState - Setter to update wizard state when rehydrating
 */
export function useWizardPersistence(
  state: WizardState,
  setState: (s: WizardState) => void
): void {
  /* Load persisted state on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = wizardStateSchema.safeParse(JSON.parse(json));
        if (parsed.success) {
          setState(parsed.data);
        } else {
          resetWizardProgress();
        }
      }
    } catch {
      /* ignore */
    }
  }, [setState]);

  /* Persist whenever state changes */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const { env: _env, ...persistable } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      /* ignore */
    }
  }, [state]);
}

