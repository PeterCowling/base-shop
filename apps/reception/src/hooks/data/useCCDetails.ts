/* src/hook/data/useCCDetails.ts */

import { useEffect, useMemo, useState } from "react";
import { ccDataSchema } from "../../schemas/ccDataSchema";
import type { CCData } from "../../types/hooks/data/ccData";
import useFirebaseSubscription from "./useFirebaseSubscription";

/**
 * Data Hook: Retrieves credit card data from the /cc node in Firebase.
 *
 * This hook:
 *  - Subscribes to /cc
 *  - Returns the raw data (no mutations or transformations)
 *  - Manages loading and error states
 */
export default function useCCDetails() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>("cc");

  const [ccData, setCCData] = useState<CCData>({});
  const [error, setError] = useState<unknown>(subError);
  useEffect(() => {
    if (!data) {
      setCCData({});
      return;
    }
    const result = ccDataSchema.safeParse(data);
    if (result.success) {
      setCCData(result.data);
      setError(subError);
    } else {
      setCCData({});
      setError(result.error);
    }
  }, [data, subError]);

  const memoData = useMemo(() => ccData, [ccData]);

  return { ccData: memoData, loading, error };
}
