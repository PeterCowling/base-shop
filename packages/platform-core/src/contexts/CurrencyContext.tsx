"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Currency = "EUR" | "USD" | "GBP";

const DEFAULT_CURRENCY: Currency = "EUR";
const LS_KEY = "PREFERRED_CURRENCY";

const CurrencyContext = createContext<
  [Currency, (c: Currency) => void] | undefined
>(undefined);

function readInitial(): Currency {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  try {
    const stored = localStorage.getItem(LS_KEY) as Currency | null;
    if (stored === "EUR" || stored === "USD" || stored === "GBP") return stored;
  } catch {}
  return DEFAULT_CURRENCY;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(readInitial);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, currency);
    }
  }, [currency]);

  return (
    <CurrencyContext.Provider value={[currency, setCurrency]}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be inside CurrencyProvider");
  return ctx;
}
