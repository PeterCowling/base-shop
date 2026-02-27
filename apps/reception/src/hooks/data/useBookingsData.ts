/* src/hooks/data/useBookingsData.ts */

import { useEffect, useState } from "react";
import {
  type DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";

import {
  getCachedData,
  setCachedData,
} from "../../lib/offline/receptionDb";
import { firebaseBookingsSchema } from "../../schemas/bookingsSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type FirebaseBookings } from "../../types/hooks/data/bookingsData";

const BOOKINGS_CACHE_KEY = "bookings";

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
    // Pre-populate from cache unconditionally; Firebase will overwrite with fresh data when online
    let cancelled = false;
    void (async () => {
      const cached = await getCachedData<T>(BOOKINGS_CACHE_KEY);
      if (!cancelled && cached) {
        setBookings(cached);
        setLoading(false);
      }
    })();

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
        const parsed = res.data as unknown as T;
        setBookings(parsed);
        setError(null);
        // Fire-and-forget cache update
        void setCachedData(BOOKINGS_CACHE_KEY, parsed);
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
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [database, startKey, endKey, limit]);

  return { bookings, loading, error };
}
