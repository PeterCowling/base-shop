// apps/cms/src/app/cms/configurator/hooks/useConfiguratorPersistence.ts
"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  wizardStateSchema,
  type WizardState,
  type StepStatus,
} from "../../wizard/schema";

/** Key used to mirror configurator progress in localStorage for preview components. */
export const STORAGE_KEY = "cms-configurator-progress";

/** Clears persisted configurator progress on the server and localStorage. */
export async function resetConfiguratorProgress(): Promise<void> {
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
 * Loads configurator state from the server and saves it back whenever the state
 * changes. A copy is mirrored to localStorage so the live preview can read it.
 */
export function useConfiguratorPersistence(
  state: WizardState,
  setState: Dispatch<SetStateAction<WizardState>>,
  onInvalid?: () => void,
  onSave?: () => void
): [
  (stepId: string, status: StepStatus) => void,
  boolean
] {
  const [saving, setSaving] = useState(false);
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
            window.dispatchEvent(new CustomEvent("configurator:update"));
          } catch {
            /* ignore */
          }
        } else {
          resetConfiguratorProgress();
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
    setSaving(true);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent("configurator:update"));
      } catch {
        /* ignore quota */
      }
      const { completed: _completed, ...data } = state;
      void _completed;
      fetch("/cms/api/wizard-progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId: "configurator", data }),
      })
        .catch(() => {
          /* ignore network errors */
        })
        .finally(() => {
          setSaving(false);
          onSave?.();
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [state, onSave]);

  /* Expose completion helper */
  const markStepComplete = (stepId: string, status: StepStatus) => {
    let updated: WizardState | null = null;
    setState((prev: WizardState) => {
      updated = {
        ...prev,
        completed: { ...prev.completed, [stepId]: status },
      };
      return updated;
    });
    if (typeof window !== "undefined" && updated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("configurator:update"));
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

  return [markStepComplete, saving];
}
