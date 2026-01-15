/* src/hooks/data/useCashCountsData.ts */

import {
  DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByChild,
  query,
  ref,
  startAt,
} from "firebase/database";
import { useEffect, useMemo, useState } from "react";

import useFirebaseSubscription from "./useFirebaseSubscription";
import { cashCountsSchema } from "../../schemas/cashCountSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { CashCount } from "../../types/hooks/data/cashCountData";
import { showToast } from "../../utils/toastUtils";
import { getErrorMessage } from "../../utils/errorMessage";

/**
 * Parameters to configure the cash count query. Each property corresponds
 * to a Firebase query modifier. All parameters are optional and only
 * supplied when the user passes them to the hook.
 */
export interface UseCashCountsDataParams {
  /**
   * Name of the child property to order the results by. If omitted no
   * ordering is applied.
   */
  orderByChild?: string;
  /**
   * Lower bound for the query. Rows with values greater than or equal to
   * this argument will be included in the result set.
   */
  startAt?: string | number;
  /**
   * Upper bound for the query. Rows with values less than or equal to
   * this argument will be included in the result set.
   */
  endAt?: string | number;
  /**
   * Maximum number of records to return from the beginning of the result
   * set.
   */
  limitToFirst?: number;
}

/**
 * Fetches and listens in real time to all CashCount records from
 * `/cashCounts`. The hook exposes a list of `cashCounts`, a `loading` flag,
 * and an `error` field. The query can be customised via the optional
 * parameters to order and filter results. Results are type‑checked
 * against the `cashCountsSchema` to ensure data integrity. When
 * validation fails the previously parsed data is retained and an error
 * toast is shown, so consumers should handle the possibility of stale
 * data.
 *
 * @param params Optional query parameters
 * @returns An object containing the list of cashCounts, a loading boolean,
 *          and an error if any
 */
export function useCashCountsData(params: UseCashCountsDataParams = {}): {
  cashCounts: CashCount[];
  loading: boolean;
  error: unknown;
} {
  const database = useFirebaseDatabase();
  const {
    orderByChild: orderChild,
    startAt: startVal,
    endAt: endVal,
    limitToFirst: limit,
  } = params;

  // Explicitly type the state to avoid implicit any. cashCounts holds an
  // array of CashCount entries, loading is a boolean, and error may
  // contain any error information from Firebase or schema parsing.
  const [cashCounts, setCashCounts] = useState<CashCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const cashCountsRef = ref(database, "cashCounts");
    let q = query(cashCountsRef);
    if (orderChild) q = query(q, orderByChild(orderChild));
    if (startVal !== undefined) q = query(q, startAt(startVal));
    if (endVal !== undefined) q = query(q, endAt(endVal));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleData = (snapshot: DataSnapshot): void => {
      if (!snapshot.exists()) {
        setCashCounts([]);
        setError(null);
        setLoading(false);
        return;
      }

      const result = cashCountsSchema.safeParse(snapshot.val());
      if (!result.success) {
        setError(result.error);
        showToast(getErrorMessage(result.error), "error");
        setLoading(false);
        return; // keep previous cashCounts
      }

      const entries = Object.values(result.data).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      );
      setCashCounts(entries);
      setError(null);
      setLoading(false);
    };

    const handleError = (err: unknown): void => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleData, handleError);

    // Clean up the listener when the component unmounts or when the
    // query parameters change.
    return unsubscribe;
  }, [database, orderChild, startVal, endVal, limit]);

  return useMemo(
    () => ({ cashCounts, loading, error }),
    [cashCounts, loading, error]
  );
}

/**
 * Fetches and listens in real time to a single CashCount record from
 * `/cashCounts/{id}`. The hook returns the record (or null if missing),
 * plus loading and error flags. Validation errors will surface via the
 * `error` field while the previous value is preserved, so the returned
 * record may be stale until a valid update arrives.
 *
 * @param id The unique identifier (key) of the CashCount record in Firebase
 * @returns An object containing the single cashCount, a loading boolean,
 *          and an error if any
 */
export function useSingleCashCount(id: string): {
  singleCashCount: CashCount | null;
  loading: boolean;
  error: unknown;
} {
  const { data, loading, error } = useFirebaseSubscription(
    id ? `cashCounts/${id}` : ""
  );

  return useMemo(
    () => ({
      singleCashCount: (data as CashCount | null) ?? null,
      loading,
      error,
    }),
    [data, loading, error]
  );
}
