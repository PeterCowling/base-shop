"use client";
// src/context/SafeDataContext.tsx
import React, {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

import {
  useSafeLogic,
  type UseSafeLogicParams,
} from "../hooks/useSafeLogic";

export type SafeDataContextValue = ReturnType<typeof useSafeLogic>;

const SafeDataContext = createContext<SafeDataContextValue | undefined>(
  undefined
);

interface SafeDataProviderProps extends UseSafeLogicParams {
  children: ReactNode;
}

export const SafeDataProvider: React.FC<SafeDataProviderProps> = ({
  children,
  startAt,
  endAt,
}) => {
  const safeLogic = useSafeLogic({ startAt, endAt });
  const value = useMemo(() => safeLogic, [safeLogic]);
  return (
    <SafeDataContext.Provider value={value}>{children}</SafeDataContext.Provider>
  );
};

export function useSafeData(): SafeDataContextValue {
  const ctx = useContext(SafeDataContext);
  if (!ctx) {
    throw new Error("useSafeData must be used within a SafeDataProvider");
  }
  return ctx;
}
