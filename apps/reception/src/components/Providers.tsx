"use client";

import type { ReactNode } from "react";

import App from "@/App";
import { AuthProvider } from "@/context/AuthContext";
import { DarkModeProvider } from "@/context/DarkModeContext";

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
