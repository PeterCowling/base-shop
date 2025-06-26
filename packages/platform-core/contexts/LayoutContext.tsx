"use client";

import { usePathname } from "next/navigation";
import { createContext, ReactNode, useContext, useState } from "react";

export interface LayoutContextValue {
  isMobileNavOpen: boolean;
  breadcrumbs: string[];
  toggleNav: () => void;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const breadcrumbs = pathname ? pathname.split("/").filter(Boolean) : [];

  const toggleNav = () => setIsMobileNavOpen((v) => !v);

  return (
    <LayoutContext.Provider value={{ isMobileNavOpen, breadcrumbs, toggleNav }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be inside LayoutProvider");
  return ctx;
}
