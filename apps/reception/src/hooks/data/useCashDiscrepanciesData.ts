/* src/hooks/data/useCashDiscrepanciesData.ts */

import { useMemo } from "react";
import { cashDiscrepanciesSchema } from "../../schemas/cashDiscrepancySchema";
import { CashDiscrepancy } from "../../types/hooks/data/cashDiscrepancyData";
import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * Reads all discrepancy records from `/cashDiscrepancies`.
 */
export function useCashDiscrepanciesData() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>("cashDiscrepancies");

  const { entries: cashDiscrepancies, error } = useMemo(() => {
    if (!data) {
      return { entries: [] as CashDiscrepancy[], error: subError };
    }
    const result = cashDiscrepanciesSchema.safeParse(data);
    if (result.success) {
      return { entries: Object.values(result.data), error: subError };
    }
    return { entries: [] as CashDiscrepancy[], error: result.error };
  }, [data, subError]);

  return useMemo(
    () => ({ cashDiscrepancies, loading, error }),
    [cashDiscrepancies, loading, error]
  );
}
