"use client";
import React, { useLayoutEffect } from "react";

import { useTheme } from "@acme/ui/hooks/useTheme";
import { ThemeProvider } from "@acme/ui/providers/ThemeProvider";

function DarkModeBridge({ children }: { children: React.ReactNode }) {
  const { setMode } = useTheme();
  useLayoutEffect(() => {
    setMode("dark");
  }, [setMode]);
  return <>{children}</>;
}

export const ReceptionThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ThemeProvider>
    <DarkModeBridge>{children}</DarkModeBridge>
  </ThemeProvider>
);
