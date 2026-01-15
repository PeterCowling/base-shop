/* src/hooks/data/useGuestsByBooking.tsx */
import {
  DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";
import { useEffect, useState } from "react";
import { guestsByBookingSchema } from "../../schemas/guestsByBookingSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { GuestsByBooking } from "../../types/hooks/data/guestsByBookingData";

/**
 * Data Hook: Retrieves the entire "guestsByBooking" node from Firebase.
 *
 * This hook does not apply any transformations. It simply reads and
 * returns the data from the "guestsByBooking" node.
 */
export interface UseGuestsByBookingParams {
  startAt?: string;
  endAt?: string;
  limitToFirst?: number;
}

export default function useGuestsByBooking(
  params: UseGuestsByBookingParams = {}
) {
  const { startAt: startKey, endAt: endKey, limitToFirst: limit } = params;
  const database = useFirebaseDatabase();

  const [guestsByBooking, setGuestsByBooking] = useState<GuestsByBooking>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const baseRef = ref(database, "guestsByBooking");
    let q = query(baseRef, orderByKey());
    if (startKey) q = query(q, startAt(startKey));
    if (endKey) q = query(q, endAt(endKey));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleSnapshot = (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        setGuestsByBooking(null);
        setError(null);
        setLoading(false);
        return;
      }

      const raw = snapshot.val() as unknown;
      const result = guestsByBookingSchema.safeParse(raw);

      if (result.success) {
        setGuestsByBooking(result.data);
        setError(null);
      } else {
        setGuestsByBooking(null);
        setError(result.error);
      }
      setLoading(false);
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleSnapshot, handleError);

    return unsubscribe;
  }, [database, startKey, endKey, limit]);

  return { guestsByBooking, loading, error };
}
