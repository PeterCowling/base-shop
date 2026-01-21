/* src/hooks/data/useBookingsData.ts */

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

import { firebaseBookingsSchema } from "../../schemas/bookingsSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { FirebaseBookings } from "../../types/hooks/data/bookingsData";

/**
 * Defines the return structure for the useBookings hook.
 */
export interface UseBookingsResult<T = FirebaseBookings> {
  bookings: T;
  loading: boolean;
  error: unknown;
}

export interface UseBookingsParams {
  startAt?: string;
  endAt?: string;
  limitToFirst?: number;
}

/**
 * A hook to fetch all bookings data from the "bookings" node in Firebase.
 * This hook:
 * - Subscribes to real-time changes at /bookings
 * - Exposes the bookings data, loading state, and any encountered error
 */
export default function useBookings<T = FirebaseBookings>(
  params: UseBookingsParams = {}
): UseBookingsResult<T> {
  const { startAt: startKey, endAt: endKey } = params;
  const { limitToFirst: limit } = params;
  const database = useFirebaseDatabase();
  const [bookings, setBookings] = useState<T>({} as T);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const baseRef = ref(database, "bookings");
    let q = query(baseRef, orderByKey());
    if (startKey) q = query(q, startAt(startKey));
    if (endKey) q = query(q, endAt(endKey));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleSnapshot = (snap: DataSnapshot) => {
      if (!snap.exists()) {
        setBookings({} as T);
        setLoading(false);
        return;
      }
      const res = firebaseBookingsSchema.safeParse(snap.val());
      if (res.success) {
        setBookings(res.data as unknown as T);
        setError(null);
      } else {
        setBookings({} as T);
        setError(res.error);
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

  return { bookings, loading, error };
}
