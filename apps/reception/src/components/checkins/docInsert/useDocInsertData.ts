/**
 * Lazy-loading hook for DocInsertData (countries, municipalities).
 * This reduces initial bundle size by only loading the ~11,000 lines
 * of data when the DocInsert page is actually visited.
 */
import { useEffect, useState } from "react";

interface DocInsertDataState {
  countries: string[];
  municipalities: string[];
  loading: boolean;
  error: Error | null;
}

const initialState: DocInsertDataState = {
  countries: [],
  municipalities: [],
  loading: true,
  error: null,
};

// Module-level cache to avoid re-loading on re-mount
let cachedData: { countries: string[]; municipalities: string[] } | null = null;

export function useDocInsertData(): DocInsertDataState {
  const [state, setState] = useState<DocInsertDataState>(() => {
    // If we already have cached data, return it immediately
    if (cachedData) {
      return {
        countries: cachedData.countries,
        municipalities: cachedData.municipalities,
        loading: false,
        error: null,
      };
    }
    return initialState;
  });

  useEffect(() => {
    // If already cached, no need to load again
    if (cachedData) return;

    let mounted = true;

    async function loadData() {
      try {
        // Dynamic import - only loaded when this hook is used
        const { countries, municipalities } = await import("./DocInsertData");

        if (!mounted) return;

        cachedData = { countries, municipalities };
        setState({
          countries,
          municipalities,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!mounted) return;

        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error("Failed to load data"),
        }));
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}
