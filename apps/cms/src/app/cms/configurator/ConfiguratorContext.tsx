// apps/cms/src/app/cms/configurator/ConfiguratorContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { NavItem } from "../wizard/schema";
import {
  configuratorStateSchema,
  type ConfiguratorState,
  type StepStatus,
} from "../wizard/schema";
import { useConfiguratorPersistence } from "./hooks/useConfiguratorPersistence";
import ConfiguratorStatusBar from "./ConfiguratorStatusBar";
import { calculateConfiguratorProgress } from "./lib/progress";
import { useLayout } from "@platform-core/contexts/LayoutContext";

export interface ConfiguratorContextValue {
  state: ConfiguratorState;
  setState: React.Dispatch<React.SetStateAction<ConfiguratorState>>;
  update: <K extends keyof ConfiguratorState>(
    key: K,
    value: ConfiguratorState[K]
  ) => void;
  markStepComplete: (stepId: string, status: StepStatus) => void;
  themeDefaults: Record<string, string>;
  themeOverrides: Record<string, string>;
  setThemeOverrides: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  dirty: boolean;
  resetDirty: () => void;
  saving: boolean;
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);
export { ConfiguratorContext };

export function ConfiguratorProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState<ConfiguratorState>(
    configuratorStateSchema.parse({})
  );
  const [dirty, setDirty] = useState(false);
  const { setConfiguratorProgress } = useLayout();

  const resetDirty = () => setDirty(false);

  // Persist state to localStorage
  const [markStepComplete, saving] = useConfiguratorPersistence(
    state,
    setState,
    undefined,
    resetDirty
  );

  const update = useCallback(
    <K extends keyof ConfiguratorState>(key: K, value: ConfiguratorState[K]) => {
      let changed = false;
      setState((prev: ConfiguratorState) => {
        const prevVal = prev[key];
        // Fast path for primitives and references
        if (Object.is(prevVal, value)) return prev;
        changed = true;
        return { ...prev, [key]: value } as ConfiguratorState;
      });
      if (changed) setDirty(true);
    },
    []
  );

  function shallowEqual(a: Record<string, string> | undefined, b: Record<string, string> | undefined) {
    if (a === b) return true;
    const aKeys = Object.keys(a || {});
    const bKeys = Object.keys(b || {});
    if (aKeys.length !== bKeys.length) return false;
    for (const k of aKeys) {
      if ((a as Record<string,string>)[k] !== (b as Record<string,string>)[k]) return false;
    }
    return true;
  }

  const setThemeOverrides = useCallback((v: React.SetStateAction<Record<string, string>>) => {
    let changed = false;
    setState((prev: ConfiguratorState) => {
      const current = prev.themeOverrides ?? {};
      const next = typeof v === "function" ? (v as (t: Record<string,string>) => Record<string,string>)(current) : v;
      if (shallowEqual(current, next)) return prev;
      changed = true;
      return { ...prev, themeOverrides: next } as ConfiguratorState;
    });
    if (changed) setDirty(true);
  }, []);

  // Auto-generate navItems from pages and keep in sync
  const navEquals = (a: NavItem[] = [], b: NavItem[] = []): boolean => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const ai = a[i];
      const bi = b[i];
      if (!ai || !bi) return false;
      if (ai.label !== bi.label || ai.url !== bi.url) return false;
      const ac = Array.isArray(ai.children) ? ai.children : [];
      const bc = Array.isArray(bi.children) ? bi.children : [];
      if (ac.length || bc.length) return false; // treat any children as different; we only generate flat
    }
    return true;
  };

  useEffect(() => {
    const pages = state.pages || [];
    const nextNav: NavItem[] = pages.map((p: { id?: string; slug: string; title?: Record<string, string> }) => {
      const titleObj = (p as unknown as { title?: Record<string, string> }).title || {};
      const firstTitle = Object.values(titleObj)[0] || p.slug;
      const url = `/${p.slug}`;
      return { id: p.id || p.slug, label: firstTitle, url } as NavItem;
    });
    if (!navEquals(state.navItems as unknown as NavItem[], nextNav)) {
      setState((prev) => ({ ...prev, navItems: nextNav } as ConfiguratorState));
      setDirty(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pages]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Avoid progress update loops by only updating when values actually change
  const lastProgressRef = useRef<ReturnType<typeof calculateConfiguratorProgress> | undefined>(undefined);
  useEffect(() => {
    const next = calculateConfiguratorProgress(state.completed);
    const prev = lastProgressRef.current;
    const changed = !prev ||
      prev.completedRequired !== next.completedRequired ||
      prev.totalRequired !== next.totalRequired ||
      prev.completedOptional !== next.completedOptional ||
      prev.totalOptional !== next.totalOptional;
    if (changed) {
      lastProgressRef.current = next;
      setConfiguratorProgress(next);
    }
  }, [state.completed, setConfiguratorProgress]);

  useEffect(() => {
    return () => {
      if (lastProgressRef.current) {
        lastProgressRef.current = undefined;
        setConfiguratorProgress(undefined);
      }
    };
  }, [setConfiguratorProgress]);

  return (
    <ConfiguratorContext.Provider
      value={{
        state,
        setState,
        update,
        markStepComplete,
        themeDefaults: state.themeDefaults,
        themeOverrides: state.themeOverrides,
        setThemeOverrides,
        dirty,
        resetDirty,
        saving,
      }}
    >
      {children}
      <ConfiguratorStatusBar />
    </ConfiguratorContext.Provider>
  );
}

export function useConfigurator(): ConfiguratorContextValue {
  const ctx = useContext(ConfiguratorContext);
  if (!ctx)
    throw new Error("useConfigurator must be used within ConfiguratorProvider");
  return ctx;
}
