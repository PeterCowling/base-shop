/* src/hooks/data/useCheckouts.ts */

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
import { useEffect, useState } from "react";

import { checkoutsSchema } from "../../schemas/checkoutSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { Checkouts } from "../../types/hooks/data/checkoutsData";

/**
 * Data Hook that subscribes to the "checkouts" node
 * and retrieves all occupant check-out records.
 * (No write operations occur here.)
 */
export interface UseCheckoutsParams {
  orderByChild?: string;
  startAt?: string | number;
  endAt?: string | number;
  limitToFirst?: number;
}

export function useCheckouts(params: UseCheckoutsParams = {}) {
  const database = useFirebaseDatabase();
  const {
    orderByChild: orderChild,
    startAt: startVal,
    endAt: endVal,
    limitToFirst: limit,
  } = params;

  const [checkouts, setCheckouts] = useState<Checkouts>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const checkoutsRef = ref(database, "checkouts");
    let q = query(checkoutsRef);
    if (orderChild) q = query(q, orderByChild(orderChild));
    if (startVal !== undefined) q = query(q, startAt(startVal));
    if (endVal !== undefined) q = query(q, endAt(endVal));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleValueChange = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const result = checkoutsSchema.safeParse(snapshot.val());
        if (result.success) {
          setCheckouts(result.data);
        } else {
          setError(result.error);
          setCheckouts(null);
        }
      } else {
        setCheckouts(null);
      }
      setLoading(false);
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleValueChange, handleError);
    return unsubscribe;
  }, [database, orderChild, startVal, endVal, limit]);

  return {
    checkouts,
    loading,
    error,
  };
}
