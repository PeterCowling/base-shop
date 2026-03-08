"use client";

import type { ReactNode } from "react";

import App from "@/App";
import { AuthProvider } from "@/context/AuthContext";
import { FirebaseSubscriptionCacheProvider } from "@/context/FirebaseSubscriptionCache";
import { LoanDataProvider } from "@/context/LoanDataContext";
import { ReceptionThemeProvider } from "@/providers/ReceptionThemeProvider";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <FirebaseSubscriptionCacheProvider>
        <LoanDataProvider>
          <ReceptionThemeProvider>
            <App>{children}</App>
          </ReceptionThemeProvider>
        </LoanDataProvider>
      </FirebaseSubscriptionCacheProvider>
    </AuthProvider>
  );
}
