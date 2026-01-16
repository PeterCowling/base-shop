/* src/hooks/data/useSafeCountsList.ts */

import { useEffect, useState } from "react";

import useFirebaseSubscription from "./useFirebaseSubscription";
import { safeCountsSchema } from "../../schemas/safeCountSchema";
import { SafeCount } from "../../types/hooks/data/safeCountData";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

/**
 * Reads all SafeCount records from /safeCounts in real time.
 */
export function useSafeCountsList() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>("safeCounts");

  const [safeCounts, setSafeCounts] = useState<SafeCount[]>([]);
  const [error, setError] = useState<unknown>(subError);

  useEffect(() => {
    if (!data) {
      setSafeCounts([]);
      return;
    }
    const result = safeCountsSchema.safeParse(data);
    if (result.success) {
      const mapped = Object.entries(result.data).map(([id, value]) => ({
        id,
        ...value,
      }));
      setSafeCounts(mapped);
    } else {
      setError(result.error);
      showToast(getErrorMessage(result.error), "error");
    }
  }, [data]);

  return { safeCounts, loading, error };
}
