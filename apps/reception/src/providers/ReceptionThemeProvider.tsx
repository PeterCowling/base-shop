"use client";
import React from "react";

import { ThemeProvider } from "@acme/ui/providers/ThemeProvider";

export const ReceptionThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => (
  <ThemeProvider>{children}</ThemeProvider>
);
