import { useEffect, useMemo, useState } from "react";
import {
  type DataSnapshot,
  endAt as fbEndAt,
  onValue,
  orderByChild,
  query,
  ref,
  startAt as fbStartAt,
} from "firebase/database";

import { tillShiftsSchema } from "../../../schemas/tillShiftSchema";
import { useFirebaseDatabase } from "../../../services/useFirebase";
import type { TillShift } from "../../../types/hooks/data/tillShiftData";
import { getErrorMessage } from "../../../utils/errorMessage";
import { showToast } from "../../../utils/toastUtils";

export interface UseTillShiftsRangeParams {
  orderByChild?: "openedAt" | "closedAt";
  startAt?: string;
  endAt?: string;
}

export function useTillShiftsRange(params: UseTillShiftsRangeParams = {}) {
  const database = useFirebaseDatabase();
  const [shifts, setShifts] = useState<TillShift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const shiftsRef = ref(database, "tillShifts");
    let q = query(shiftsRef, orderByChild(params.orderByChild ?? "closedAt"));

    if (params.startAt) {
      q = query(q, fbStartAt(params.startAt));
    }
    if (params.endAt) {
      q = query(q, fbEndAt(params.endAt));
    }

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
        .sort((a, b) => {
          const aKey = a.closedAt ?? a.openedAt;
          const bKey = b.closedAt ?? b.openedAt;
          return aKey.localeCompare(bKey);
        });

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
  }, [database, params.endAt, params.orderByChild, params.startAt]);

  return useMemo(
    () => ({ shifts, loading, error }),
    [shifts, loading, error]
  );
}
