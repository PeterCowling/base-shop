/* src/hooks/data/useCheckins.ts */

import {
  DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByChild,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";
import { useEffect, useState } from "react";

import { checkinsSchema } from "../../schemas/checkinSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { Checkins } from "../../types/hooks/data/checkinData";

/**
 * Data Hook that subscribes to the "checkins" node
 * and retrieves all check-in records without applying any transformations.
 */
export interface UseCheckinsParams {
  startAt?: string;
  endAt?: string;
  orderByChild?: string;
  limitToFirst?: number;
}

export function useCheckins(params: UseCheckinsParams = {}) {
  const database = useFirebaseDatabase();

  const {
    startAt: startKey,
    endAt: endKey,
    orderByChild: orderChild,
    limitToFirst: limit,
  } = params;
  const [checkins, setCheckins] = useState<Checkins>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const baseRef = ref(database, "checkins");
    let q = query(
      baseRef,
      orderChild ? orderByChild(orderChild) : orderByKey()
    );
    if (startKey) q = query(q, startAt(startKey));
    if (endKey) q = query(q, endAt(endKey));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleValueChange = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const result = checkinsSchema.safeParse(snapshot.val());
        if (result.success) {
          setCheckins(result.data);
        } else {
          setError(result.error);
          setCheckins(null);
        }
      } else {
        setCheckins(null);
      }
      setLoading(false);
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleValueChange, handleError);
    return () => {
      unsubscribe();
    };
  }, [database, startKey, endKey, orderChild, limit]);

  return {
    checkins,
    loading,
    error,
  };
}
