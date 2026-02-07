"use client";

import { createContext, useContext } from "react";

import {
  type RapidLaunchDefaultsState,
  useRapidLaunchDefaults,
} from "./hooks/useRapidLaunchDefaults";

const RapidLaunchDefaultsContext =
  createContext<RapidLaunchDefaultsState | null>(null);

export function RapidLaunchDefaultsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const state = useRapidLaunchDefaults();
  return (
    <RapidLaunchDefaultsContext.Provider value={state}>
      {children}
    </RapidLaunchDefaultsContext.Provider>
  );
}

export function useRapidLaunchDefaultsContext(): RapidLaunchDefaultsState {
  const ctx = useContext(RapidLaunchDefaultsContext);
  if (!ctx) {
    throw new Error(
      /* i18n-exempt -- CMS-1043 developer-only error message [ttl=2026-12-31] */
      "useRapidLaunchDefaultsContext must be used within RapidLaunchDefaultsProvider"
    );
  }
  return ctx;
}
