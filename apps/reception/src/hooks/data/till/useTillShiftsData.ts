import { useEffect, useMemo, useState } from "react";
import {
  type DataSnapshot,
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
} from "firebase/database";

import { tillShiftsSchema } from "../../../schemas/tillShiftSchema";
import { useFirebaseDatabase } from "../../../services/useFirebase";
import type { TillShift } from "../../../types/hooks/data/tillShiftData";
import { getErrorMessage } from "../../../utils/errorMessage";
import { showToast } from "../../../utils/toastUtils";

export interface UseTillShiftsDataParams {
  limitToLast?: number;
}

export function useTillShiftsData(params: UseTillShiftsDataParams = {}) {
  const database = useFirebaseDatabase();
  const limit = params.limitToLast ?? 20;
  const [shifts, setShifts] = useState<TillShift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const shiftsRef = ref(database, "tillShifts");
    const q = query(shiftsRef, orderByChild("openedAt"), limitToLast(limit));

    const handleData = (snapshot: DataSnapshot): void => {
      if (!snapshot.exists()) {
        setShifts([]);
        setError(null);
        setLoading(false);
        return;
      }

      const result = tillShiftsSchema.safeParse(snapshot.val());
      if (!result.success) {
        setError(result.error);
        showToast(getErrorMessage(result.error), "error");
        setLoading(false);
        return;
      }

      const entries = Object.entries(result.data as Record<string, TillShift>)
        .map(([id, value]) => ({
          ...value,
          id,
        }))
        .sort((a, b) => a.openedAt.localeCompare(b.openedAt));

      setShifts(entries);
      setError(null);
      setLoading(false);
    };

    const handleError = (err: unknown): void => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleData, handleError);
    return unsubscribe;
  }, [database, limit]);

  return useMemo(
    () => ({ shifts, loading, error }),
    [shifts, loading, error]
  );
}
