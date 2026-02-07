// File: src/hooks/utilities/useDebugLogger.ts
import { useEffect } from "react";

/**
 * useDebugLogger logs data with a label whenever it changes.
 * Use this for debugging purposes only.
 */
export function useDebugLogger<T>(label: string, data: T): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DEBUG] ${label}:`, data);
    }
  }, [label, data]);
}

