import { useMemo } from "react";

import { keycardDiscrepanciesSchema } from "../../schemas/keycardDiscrepancySchema";
import type { KeycardDiscrepancy } from "../../types/hooks/data/keycardDiscrepancyData";

import useFirebaseSubscription from "./useFirebaseSubscription";

export function useKeycardDiscrepanciesData() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>("keycardDiscrepancies");

  const { entries: keycardDiscrepancies, error } = useMemo(() => {
    if (!data) {
      return { entries: [] as KeycardDiscrepancy[], error: subError };
    }
    const result = keycardDiscrepanciesSchema.safeParse(data);
    if (result.success) {
      const entries: KeycardDiscrepancy[] = Object.values(result.data).flatMap((entry) =>
        entry ? [entry] : []
      );
      return { entries, error: subError };
    }
    return { entries: [] as KeycardDiscrepancy[], error: result.error };
  }, [data, subError]);

  return useMemo(
    () => ({ keycardDiscrepancies, loading, error }),
    [keycardDiscrepancies, loading, error]
  );
}
