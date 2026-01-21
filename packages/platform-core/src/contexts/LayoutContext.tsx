"use client";

import { createContext, type ReactNode,useContext, useState } from "react";
import { usePathname } from "next/navigation";

export interface ConfiguratorProgress {
  completedRequired: number;
  totalRequired: number;
  completedOptional: number;
  totalOptional: number;
}

export interface LayoutContextValue {
  isMobileNavOpen: boolean;
  breadcrumbs: string[];
  toggleNav: () => void;
  configuratorProgress?: ConfiguratorProgress;
  setConfiguratorProgress: (p?: ConfiguratorProgress) => void;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [configuratorProgress, setConfiguratorProgress] =
    useState<ConfiguratorProgress>();
  const pathname = usePathname();
  const breadcrumbs = pathname ? pathname.split("/").filter(Boolean) : [];

  const toggleNav = () => setIsMobileNavOpen((v) => !v);

  return (
    <LayoutContext.Provider
      value={{
        isMobileNavOpen,
        breadcrumbs,
        toggleNav,
        configuratorProgress,
        setConfiguratorProgress,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be inside LayoutProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
  return ctx;
}
