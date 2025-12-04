// apps/cms/src/app/cms/configurator/hooks/useConfiguratorPersistence.ts
"use client";

import {
  useEffect,
  useState,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { getCsrfToken } from "@acme/shared-utils";
import {
  configuratorStateSchema,
  type ConfiguratorState,
  type StepStatus,
} from "../../wizard/schema";

const LEGACY_STORAGE_KEY = "cms-wizard-progress";

/** Key used to mirror configurator progress in localStorage for preview components. */
export const STORAGE_KEY = "cms-configurator-progress";

/** Clears persisted configurator progress on the server and localStorage. */
export async function resetConfiguratorProgress(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    try {
      await fetch("/cms/api/configurator-progress", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() ?? "",
        },
        body: JSON.stringify({ stepId: null, data: {}, completed: {} }),
      });
    } catch {
      /* ignore network errors */
    } finally {
      try {
        window.dispatchEvent(new CustomEvent("configurator:update"));
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Loads configurator state from the server and saves it back whenever the state
 * changes. A copy is mirrored to localStorage so the live preview can read it.
 */
export function useConfiguratorPersistence(
  state: ConfiguratorState,
  setState: Dispatch<SetStateAction<ConfiguratorState>>,
  onInvalid?: () => void,
  onSave?: () => void
): [
  (stepId: string, status: StepStatus) => void,
  boolean
] {
  const [saving, setSaving] = useState(false);
  const hydratedRef = useRef(false);
  const loadedRef = useRef(false);
  const lastSavedDataHash = useRef<string | null>(null);
  /* Load persisted state once on mount */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hydratedRef.current) return;
    hydratedRef.current = true; // guard against re-entry (StrictMode, re-renders)

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    fetch("/cms/api/configurator-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        let source = json;
        if (!source && legacy) {
          try {
            source = JSON.parse(legacy);
          } catch {
            /* ignore */
          }
        }
        if (!source) {
          loadedRef.current = true;
          return;
        }
        const baseState = { ...(source.state ?? source) } as Record<string, unknown>;
        // Do not hydrate env secrets from server-side drafts; env is managed via /cms/api/env.
        if ("env" in baseState) {
          delete baseState.env;
        }
        const parsed = configuratorStateSchema.safeParse({
          ...baseState,
          completed: (source as { completed?: unknown }).completed ?? {},
        });
        if (parsed.success) {
          setState(parsed.data);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
            window.dispatchEvent(new CustomEvent("configurator:update"));
          } catch {
            /* ignore */
          }
          loadedRef.current = true;
        } else {
          resetConfiguratorProgress();
          onInvalid?.();
          loadedRef.current = true;
        }
      })
      .catch(() => {
        /* ignore */
        loadedRef.current = true;
      });
  }, [setState, onInvalid]);

  /* Persist whenever the state changes (skip if no meaningful change) */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Always mirror the latest state to localStorage so preview
    // consumers stay in sync even if the initial server load fails.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent("configurator:update"));
    } catch {
      /* ignore quota */
    }

    // Skip server sync until the initial load (or fallback) has completed.
    if (!loadedRef.current) return;

    // Hash only the data portion (exclude `completed`, saved separately via PATCH).
    // Avoid sending env secrets to the server; those are managed via /cms/api/env.
    const { completed: _completed, env: _env, ...data } = state;
    void _completed;
    void _env;
    const nextHash = (() => {
      try {
        return JSON.stringify(data);
      } catch {
        return null;
      }
    })();

    if (lastSavedDataHash.current && nextHash === lastSavedDataHash.current) {
      // No changes since last save; do nothing.
      return;
    }
    setSaving(true);
    const timer = setTimeout(() => {
      // Persist only data (without completed) via PUT
      fetch("/cms/api/configurator-progress", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() ?? "",
        },
        body: JSON.stringify({ stepId: "configurator", data }),
      })
        .catch(() => {
          /* ignore network errors */
        })
        .finally(() => {
          setSaving(false);
          lastSavedDataHash.current = nextHash;
          onSave?.();
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [state, onSave]);

  /* Expose completion helper */
  const markStepComplete = (stepId: string, status: StepStatus) => {
    if (state.completed?.[stepId] === status) return; // no-op
    const updated: ConfiguratorState = {
      ...state,
      completed: { ...state.completed, [stepId]: status },
    };
    setState(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("configurator:update"));
      } catch {
        /* ignore quota */
      }
      fetch("/cms/api/configurator-progress", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() ?? "",
        },
        body: JSON.stringify({ stepId, completed: status }),
      }).catch(() => {
        /* ignore network errors */
      });
    }
  };

  return [markStepComplete, saving];
}
