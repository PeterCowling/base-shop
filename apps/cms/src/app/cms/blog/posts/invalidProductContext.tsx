"use client";

import { createContext, type ReactNode,useCallback, useContext, useState } from "react";

interface InvalidProductContextValue {
  invalidProducts: Record<string, string>;
  markValidity: (key: string, valid: boolean, slug: string) => void;
}

export const InvalidProductContext = createContext<InvalidProductContextValue | null>(null);

export function InvalidProductProvider({ children }: { children: ReactNode }) {
  const [invalidProducts, setInvalidProducts] = useState<Record<string, string>>({});
  const markValidity = useCallback((key: string, valid: boolean, slug: string) => {
    setInvalidProducts((prev) => {
      const next = { ...prev };
      if (valid) {
        delete next[key];
      } else {
        next[key] = slug;
      }
      return next;
    });
  }, []);
  return (
    <InvalidProductContext.Provider value={{ invalidProducts, markValidity }}>
      {children}
    </InvalidProductContext.Provider>
  );
}

export function useInvalidProductContext() {
  const ctx = useContext(InvalidProductContext);
  if (!ctx) throw new Error("useInvalidProductContext must be used within InvalidProductProvider");
  return ctx;
}
