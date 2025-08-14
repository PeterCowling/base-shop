// apps/cms/src/app/cms/configurator/ConfiguratorContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  wizardStateSchema,
  type WizardState,
  type StepStatus,
} from "../wizard/schema";
import { useConfiguratorPersistence } from "./hooks/useConfiguratorPersistence";
import ConfiguratorStatusBar from "./ConfiguratorStatusBar";

export interface ConfiguratorContextValue {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  markStepComplete: (stepId: string, status: StepStatus) => void;
  themeDefaults: Record<string, string>;
  themeOverrides: Record<string, string>;
  setThemeOverrides: (v: Record<string, string>) => void;
  dirty: boolean;
  resetDirty: () => void;
  saving: boolean;
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

export function ConfiguratorProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState<WizardState>(wizardStateSchema.parse({}));
  const [dirty, setDirty] = useState(false);

  const resetDirty = () => setDirty(false);

  // Persist state to localStorage
  const [markStepComplete, saving] = useConfiguratorPersistence(
    state,
    (s) => setState(() => s),
    undefined,
    resetDirty
  );

  const update = <K extends keyof WizardState>(
    key: K,
    value: WizardState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const setThemeOverrides = (v: Record<string, string>) => {
    setState((prev) => ({ ...prev, themeOverrides: v }));
    setDirty(true);
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

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

