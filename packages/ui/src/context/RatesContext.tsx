// src/context/RatesContext.tsx
// -----------------------------------------------------------------------------
// Fetches `/data/rates.json` on the **client only** and exposes it via context.
// Heavy JSON (~700 kB) is no longer bundled into JS – it streams from the
// server when the user first needs any price data.
// -----------------------------------------------------------------------------

import type { RateCalendar } from "@/types/rates";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface RatesState {
  rates: RateCalendar | null;
  loading: boolean;
  error?: Error;
}

const RatesContext = createContext<RatesState>({ rates: null, loading: true });

export function RatesProvider({ children }: { children: ReactNode }): JSX.Element {
  const [rates, setRates] = useState<RateCalendar | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch("/data/rates.json", { cache: "force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as RateCalendar;
      setRates(json);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  /* Client‑side only */
  useEffect(() => {
    fetchRates().catch(console.error);
  }, [fetchRates]);

  const value = useMemo<RatesState>(() => ({ rates, loading, error }), [rates, loading, error]);

  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>;
}

export const useRates = (): RatesState => useContext(RatesContext);
