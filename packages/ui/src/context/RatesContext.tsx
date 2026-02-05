// src/context/RatesContext.tsx
// -----------------------------------------------------------------------------
// Fetches `/data/rates.json` on the **client only** and exposes it via context.
// Heavy JSON (~700 kB) is no longer bundled into JS – it streams from the
// server when the user first needs any price data.
// -----------------------------------------------------------------------------

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { RateCalendar } from "../types/rates";

interface RatesState {
  rates: RateCalendar | null;
  loading: boolean;
  error?: Error;
}

type RatesStatus = "idle" | "loading" | "loaded" | "error";

type RatesContextValue = RatesState & {
  requestRates: () => void;
};

const RatesContext = createContext<RatesContextValue>({
  rates: null,
  loading: true,
  requestRates: () => undefined,
});

export function RatesProvider({ children }: { children: ReactNode }): JSX.Element {
  const [rates, setRates] = useState<RateCalendar | null>(null);
  const [status, setStatus] = useState<RatesStatus>("idle");
  const [error, setError] = useState<Error>();

  const fetchPromiseRef = useRef<Promise<void> | null>(null);
  const statusRef = useRef<RatesStatus>(status);
  statusRef.current = status;

  const fetchRatesOnce = useCallback((): void => {
    if (typeof window === "undefined") return;
    if (statusRef.current === "loading" || statusRef.current === "loaded") return;
    if (fetchPromiseRef.current) return;

    statusRef.current = "loading";
    setStatus("loading");

    fetchPromiseRef.current = (async () => {
      try {
        const res = await fetch("/data/rates.json", { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as RateCalendar;
        setError(undefined);
        setRates(json);
        statusRef.current = "loaded";
        setStatus("loaded");
      } catch (err) {
        setRates(null);
        setError(err as Error);
        statusRef.current = "error";
        setStatus("error");
      } finally {
        fetchPromiseRef.current = null;
      }
    })();
  }, []);

  const loading = status === "idle" || status === "loading";

  const value = useMemo<RatesContextValue>(
    () => ({ rates, loading, error, requestRates: fetchRatesOnce }),
    [rates, loading, error, fetchRatesOnce],
  );

  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>;
}

export const useRates = (): RatesState => {
  const ctx = useContext(RatesContext);

  // Only fetch rates when a consumer opts in by calling the hook.
  useEffect(() => {
    ctx.requestRates();
  }, [ctx.requestRates]);

  return { rates: ctx.rates, loading: ctx.loading, error: ctx.error };
};

export const usePrefetchRates = (): (() => void) => {
  const ctx = useContext(RatesContext);
  return ctx.requestRates;
};
