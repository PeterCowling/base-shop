"use client";

import type { ReactNode } from "react";

import App from "@/App";
import { AuthProvider } from "@/context/AuthContext";
import { LoanDataProvider } from "@/context/LoanDataContext";
import { ReceptionThemeProvider } from "@/providers/ReceptionThemeProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <LoanDataProvider>
        <ReceptionThemeProvider>
          <App>{children}</App>
        </ReceptionThemeProvider>
      </LoanDataProvider>
    </AuthProvider>
  );
}
