/* src/hooks/data/useCashCountsList.ts */

import { useEffect, useState } from "react";

import useFirebaseSubscription from "./useFirebaseSubscription";
import { cashCountsSchema } from "../../schemas/cashCountSchema";
import { CashCount } from "../../types/hooks/data/cashCountData";
import { showToast } from "../../utils/toastUtils";
import { getErrorMessage } from "../../utils/errorMessage";

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
      setCashCounts(Object.values(result.data));
    } else {
      setError(result.error);
      showToast(getErrorMessage(result.error), "error");
    }
  }, [data]);

  return { cashCounts, loading, error };
}
