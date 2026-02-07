/* src/hooks/data/useFinancialsRoom.ts */
import { useEffect, useState } from "react";
import {
  type DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByChild,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";

import { financialsRoomSchema } from "../../schemas/financialsRoomSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type FinancialsRoom } from "../../types/hooks/data/financialsRoomData";

export interface UseFinancialsRoomParams {
  startAt?: string;
  endAt?: string;
  orderByChild?: string;
  limitToFirst?: number;
}

export default function useFinancialsRoom(
  params: UseFinancialsRoomParams = {}
) {
  const database = useFirebaseDatabase();
  const {
    startAt: startKey,
    endAt: endKey,
    orderByChild: orderChild,
    limitToFirst: limit,
  } = params;

  const [financialsRoom, setFinancialsRoom] = useState<FinancialsRoom>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const financialsRoomRef = ref(database, "financialsRoom");
    let q = query(
      financialsRoomRef,
      orderChild ? orderByChild(orderChild) : orderByKey()
    );
    if (startKey) q = query(q, startAt(startKey));
    if (endKey) q = query(q, endAt(endKey));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const onDataChange = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const res = financialsRoomSchema.safeParse(snapshot.val());
        if (res.success) {
          setFinancialsRoom(res.data);
          setError(null);
        } else {
          setFinancialsRoom({});
          setError(res.error);
        }
      } else {
        setFinancialsRoom({});
      }
      setLoading(false);
    };

    const onError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, onDataChange, onError);

    return unsubscribe;
  }, [database, startKey, endKey, orderChild, limit]);

  return {
    financialsRoom,
    loading,
    error,
  };
}
