"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Currency = "AUD" | "EUR" | "USD" | "GBP";

const DEFAULT_CURRENCY: Currency = "EUR";
const LS_KEY = "PREFERRED_CURRENCY";
const WINDOW_OVERRIDE_SYMBOL = Symbol.for(
  "acme.platformCore.currencyWindowOverride",
);

function resolveWindow(): Window | undefined {
  if (
    Object.prototype.hasOwnProperty.call(
      globalThis,
      WINDOW_OVERRIDE_SYMBOL,
    )
  ) {
    const override = (globalThis as Record<symbol, unknown>)[
      WINDOW_OVERRIDE_SYMBOL
    ] as Window | null | undefined;
    return override ?? undefined;
  }
  if (typeof window === "undefined") return undefined;
  return window;
}

const CurrencyContext = createContext<
  [Currency, (c: Currency) => void] | undefined
>(undefined);

export function readInitial(): Currency {
  const win = resolveWindow();
  if (!win) return DEFAULT_CURRENCY;
  try {
    const stored = win.localStorage.getItem(LS_KEY) as Currency | null;
    if (stored === "AUD" || stored === "EUR" || stored === "USD" || stored === "GBP") {
      return stored;
    }
  } catch {}
  return DEFAULT_CURRENCY;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);

  useEffect(() => {
    const initial = readInitial();
    setCurrency((prev) => (prev === initial ? prev : initial));
  }, []);

  useEffect(() => {
    const win = resolveWindow();
    if (win) {
      try {
        win.localStorage.setItem(LS_KEY, currency);
      } catch {}
    }
  }, [currency]);

  return (
    <CurrencyContext.Provider value={[currency, setCurrency]}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  try {
    const ctx = useContext(CurrencyContext);
    if (!ctx) throw new Error("useCurrency must be inside CurrencyProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
    return ctx;
  } catch (err) {
    // React throws different errors when hooks run outside a component.
    // Tests invoke this hook directly, so normalize those errors into the
    // expected provider usage message.
    if (
      err instanceof Error &&
      (err.message.includes("Invalid hook call") || // i18n-exempt -- matching React core error message
        err.message.includes("reading 'useContext'")) // i18n-exempt -- matching React core error message
    ) {
      throw new Error("useCurrency must be inside CurrencyProvider"); // i18n-exempt -- developer guidance for incorrect hook usage
    }
    throw err;
  }
}
