// apps/cms/src/app/cms/configurator/ConfiguratorContext.tsx
"use client";

import React, { createContext, useContext, useState } from "react";
import {
  wizardStateSchema,
  type WizardState,
  type StepStatus,
} from "../wizard/schema";
import { useConfiguratorPersistence } from "./hooks/useConfiguratorPersistence";

interface ConfiguratorContextValue {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  markStepComplete: (stepId: string, status: StepStatus) => void;
}

const ConfiguratorContext = createContext<ConfiguratorContextValue | null>(null);

export function ConfiguratorProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState<WizardState>(wizardStateSchema.parse({}));

  // Persist state to localStorage
  const markStepComplete = useConfiguratorPersistence(
    state,
    (s) => setState(() => s)
  );

  const update = <K extends keyof WizardState>(
    key: K,
    value: WizardState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ConfiguratorContext.Provider
      value={{ state, setState, update, markStepComplete }}
    >
      {children}
    </ConfiguratorContext.Provider>
  );
}

export function useConfigurator(): ConfiguratorContextValue {
  const ctx = useContext(ConfiguratorContext);
  if (!ctx)
    throw new Error("useConfigurator must be used within ConfiguratorProvider");
  return ctx;
}

