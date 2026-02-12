"use client";

import React, { createContext, useContext } from "react";

import { useTillShifts } from "./useTillShifts";

export type TillShiftContextValue = ReturnType<typeof useTillShifts>;

const TillShiftContext = createContext<TillShiftContextValue | undefined>(undefined);

interface TillShiftProviderProps {
  children: React.ReactNode;
}

export const TillShiftProvider: React.FC<TillShiftProviderProps> = ({ children }) => {
  const value = useTillShifts();
  return <TillShiftContext.Provider value={value}>{children}</TillShiftContext.Provider>;
};

export function useTillShiftContext(): TillShiftContextValue {
  const ctx = useContext(TillShiftContext);
  if (!ctx) {
    throw new Error("useTillShiftContext must be used within a TillShiftProvider");
  }
  return ctx;
}
