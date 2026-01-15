"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/context/AuthContext";
import { DarkModeProvider } from "@/context/DarkModeContext";
import App from "@/App";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <App>{children}</App>
      </DarkModeProvider>
    </AuthProvider>
  );
}
