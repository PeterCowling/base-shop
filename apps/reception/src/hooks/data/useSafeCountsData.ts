/* src/hooks/data/useSafeCountsData.ts */

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
import { safeCountsSchema } from "../../schemas/safeCountSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { SafeCount } from "../../types/hooks/data/safeCountData";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";
import { parseYMD } from "../../utils/dateUtils";

/**
 * Fetches and listens in real time to all SafeCount records from
 * `/safeCounts`. If validation of a snapshot fails, the previous values
 * are kept and an error toast is displayed, which means consumers may
 * receive stale data until the next valid update.
 */
export interface UseSafeCountsDataParams {
  orderByChild?: string;
  startAt?: string | number;
  endAt?: string | number;
  limitToFirst?: number;
}

export function useSafeCountsData(params: UseSafeCountsDataParams = {}) {
  const database = useFirebaseDatabase();
  const {
    orderByChild: orderChild,
    startAt: startVal,
    endAt: endVal,
    limitToFirst: limit,
  } = params;
  const [safeCounts, setSafeCounts] = useState<SafeCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const safeCountsRef = ref(database, "safeCounts");
    let q = query(safeCountsRef);
    if (orderChild) {
      q = query(q, orderByChild(orderChild));
    } else if (startVal !== undefined || endVal !== undefined) {
      q = query(q, orderByChild("timestamp"));
    }
    if (startVal !== undefined) q = query(q, startAt(startVal));
    if (endVal !== undefined) q = query(q, endAt(endVal));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleData = (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        setSafeCounts([]);
        setError(null);
        setLoading(false);
        return;
      }

      const result = safeCountsSchema.safeParse(snapshot.val());
      if (!result.success) {
        setError(result.error);
        showToast(getErrorMessage(result.error), "error");
        setLoading(false);
        return; // keep previous safeCounts
      }

      const entries = Object.entries(result.data).map(([id, value]) => ({
        id,
        ...value,
      }));
      entries.sort((a, b) => {
        const ta = parseYMD(a.timestamp);
        const tb = parseYMD(b.timestamp);
        if (!Number.isNaN(ta) && !Number.isNaN(tb)) {
          return ta - tb;
        }
        return a.timestamp.localeCompare(b.timestamp);
      });
      setSafeCounts(entries);
      setError(null);
      setLoading(false);
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleData, handleError);

    return unsubscribe;
  }, [database, orderChild, startVal, endVal, limit]);

  return useMemo(
    () => ({
      safeCounts,
      loading,
      error,
    }),
    [safeCounts, loading, error]
  );
}

/**
 * Fetches and listens in real time to a single SafeCount record from
 * `/safeCounts/{id}`. Validation errors are surfaced via the returned
 * `error` while the previous value is preserved, so consumers should be
 * aware the data may be stale after a failed update.
 */
export function useSingleSafeCount(id: string) {
  const { data, loading, error } = useFirebaseSubscription<SafeCount>(
    id ? `safeCounts/${id}` : ""
  );

  return useMemo(
    () => ({
      singleSafeCount: data ?? null,
      loading,
      error,
    }),
    [data, loading, error]
  );
}
