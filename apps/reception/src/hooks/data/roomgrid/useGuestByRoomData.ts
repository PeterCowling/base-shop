/** /src/hooks/data/guestByRoom/useGuestByRoomData.ts */
import { useEffect, useState } from "react";
import {
  type DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByChild,
  query,
  ref,
  startAt,
} from "firebase/database";

import { useFirebaseDatabase } from "../../../services/useFirebase";

/**
 * Shape for the /guestByRoom node in Firebase.
 *
 * {
 *   "<occupant_id>": {
 *     allocated?: "<string>",  // May be absent when occupant is unallocated
 *     booked?: "<string>"      // May be absent for some occupants
 *   }
 * }
 *
 * Note: both fields are optional here to match the raw Firebase shape (confirmed
 * in useGuestByRoom.ts FirebaseGuestRoom). The shared normalizer (useGuestByRoom.ts)
 * coerces absent values to "" — this roomgrid-local interface reflects the raw data
 * that useGuestByRoomData reads directly from Firebase.
 */
export interface IGuestByRoomData {
  [occupantId: string]: {
    allocated?: string;
    booked?: string;
  };
}
export interface UseGuestByRoomDataParams {
  orderByChild?: string;
  startAt?: string | number;
  endAt?: string | number;
  limitToFirst?: number;
}

export default function useGuestByRoomData(
  params: UseGuestByRoomDataParams = {}
) {
  const database = useFirebaseDatabase();
  const {
    orderByChild: orderChild,
    startAt: startVal,
    endAt: endVal,
    limitToFirst: limit,
  } = params;

  const [guestByRoomData, setGuestByRoomData] = useState<IGuestByRoomData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const guestByRoomRef = ref(database, "guestByRoom");
    let q = query(guestByRoomRef);
    if (orderChild) q = query(q, orderByChild(orderChild));
    if (startVal !== undefined) q = query(q, startAt(startVal));
    if (endVal !== undefined) q = query(q, endAt(endVal));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleSnapshot = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        setGuestByRoomData(snapshot.val() as IGuestByRoomData);
      } else {
        setGuestByRoomData({});
      }
      setLoading(false);
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleSnapshot, handleError);

    return unsubscribe;
  }, [database, orderChild, startVal, endVal, limit]);

  return {
    guestByRoomData,
    loading,
    error,
  };
}
