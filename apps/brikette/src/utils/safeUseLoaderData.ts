// Utility: safely use react-router's useLoaderData in environments
// where a data router may not be present (e.g., shallow unit tests).
// If no data router is available, returns undefined instead of throwing.
//
// Note: This preserves a single, unconditional hook call so React's
// rules of hooks remain satisfied even if an error is thrown internally.

import { useLoaderData } from "react-router-dom";

// Name starts with `use` to satisfy the hooks rule while preserving
// the same single, unconditional call to `useLoaderData()`.
export function useSafeLoaderData<T = unknown>(): T | undefined {
  try {
    return useLoaderData() as T;
  } catch {
    // Outside a data router – allow caller to fallback.
    return undefined;
  }
}

// Backwards-compat: keep the old export name used across the app
export const safeUseLoaderData = useSafeLoaderData;
