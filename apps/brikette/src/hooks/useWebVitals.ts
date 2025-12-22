// src/hooks/useWebVitals.ts
/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] dynamic import specifier is not user-facing */
import { useEffect } from "react";

export const useWebVitals = (): void => {
  useEffect(() => {
    const hasWindow = typeof window !== "undefined";
    const hasDocument = typeof document !== "undefined";

    if (!hasWindow || !hasDocument) return;

    void import("@/performance/reportWebVitals")
      .then((m) => {
        m.initWebVitals();
      })
      .catch(() => {
        // Swallow errors – we don't want reporting to break the app/tests
      });
  }, []);
};
