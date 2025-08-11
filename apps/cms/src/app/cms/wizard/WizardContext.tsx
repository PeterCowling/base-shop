// apps/cms/src/app/cms/wizard/WizardContext.tsx
"use client";

import React, { createContext, useContext, useState } from "react";
import { wizardStateSchema, type WizardState } from "./schema";
import { useWizardPersistence } from "./hooks/useWizardPersistence";

interface WizardContextValue {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  update: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  markStepComplete: (stepId: string, status: boolean) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState<WizardState>(wizardStateSchema.parse({}));

  // Persist state to localStorage
  const markStepComplete = useWizardPersistence(state, (s) => setState(() => s));

  const update = <K extends keyof WizardState>(
    key: K,
    value: WizardState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <WizardContext.Provider value={{ state, setState, update, markStepComplete }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}

