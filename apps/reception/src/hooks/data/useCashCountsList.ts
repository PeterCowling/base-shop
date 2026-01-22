/* src/hooks/data/useCashCountsList.ts */

import { useEffect, useState } from "react";

import { cashCountsSchema } from "../../schemas/cashCountSchema";
import type { CashCount } from "../../types/hooks/data/cashCountData";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * Reads all CashCount records from /cashCounts in real time.
 */
export function useCashCountsList() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>("cashCounts");

  const [cashCounts, setCashCounts] = useState<CashCount[]>([]);
  const [error, setError] = useState<unknown>(subError);

  useEffect(() => {
    if (!data) {
      setCashCounts([]);
      return;
    }
    const result = cashCountsSchema.safeParse(data);
    if (result.success) {
      const entries: CashCount[] = Object.values(result.data).flatMap((entry) =>
        entry ? [entry] : []
      );
      setCashCounts(entries);
    } else {
      setError(result.error);
      showToast(getErrorMessage(result.error), "error");
    }
  }, [data]);

  return { cashCounts, loading, error };
}
