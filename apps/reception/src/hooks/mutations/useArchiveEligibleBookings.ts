import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { get, ref } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { getLocalToday } from "../../utils/dateUtils";

interface CheckoutRecord {
  reservationCode?: string;
  timestamp?: string;
}

interface CheckoutsNode {
  [dateKey: string]: Record<string, CheckoutRecord>;
}

export interface ArchiveEligibleBooking {
  bookingRef: string;
  checkOutDate: string;
}

/**
 * Hook that lists bookings eligible for archiving with their checkout dates.
 */
export default function useArchiveEligibleBookings(autoRefresh = false) {
  const database = useFirebaseDatabase();
  const [bookings, setBookings] = useState<ArchiveEligibleBooking[]>([]);
  const [loading, setLoading] = useState(autoRefresh);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!database) {
      setError("Database not initialized.");
      return;
    }

    flushSync(() => {
      setLoading(true);
    });
    setError(null);

    const today = getLocalToday();

    try {
      const checkoutsSnap = await get(ref(database, "checkouts"));
      if (!checkoutsSnap.exists()) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const checkouts = checkoutsSnap.val() as CheckoutsNode;
      const occupantMap: Record<
        string,
        { bookingRef: string; dateKey: string }
      > = {};

      for (const [dateKey, occMap] of Object.entries(checkouts)) {
        if (dateKey >= today) continue;
        for (const [occId, rec] of Object.entries(occMap)) {
          const bookingRef = rec?.reservationCode;
          if (bookingRef) {
            occupantMap[occId] = { bookingRef, dateKey };
          }
        }
      }

      const bookingGroups: Record<string, string> = {};
      const entries = Object.entries(occupantMap);

      for (const [occupantId, { bookingRef, dateKey }] of entries) {
        const bookingSnap = await get(
          ref(database, `bookings/${bookingRef}/${occupantId}`)
        );
        if (bookingSnap.exists()) {
          if (
            !bookingGroups[bookingRef] ||
            dateKey < bookingGroups[bookingRef]
          ) {
            bookingGroups[bookingRef] = dateKey;
          }
        }
      }

      const result = Object.entries(bookingGroups)
        .filter(([, checkOutDate]) => checkOutDate < today)
        .map(([bookingRef, checkOutDate]) => ({ bookingRef, checkOutDate }))
        .sort((a, b) => a.checkOutDate.localeCompare(b.checkOutDate))
        // Limit to the same 50 records that the archive mutation processes
        .slice(0, 50);
      setBookings(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [database]);

  useEffect(() => {
    if (autoRefresh) {
      refresh();
    }
  }, [refresh, autoRefresh]);

  return { bookings, loading, error, refresh };
}
