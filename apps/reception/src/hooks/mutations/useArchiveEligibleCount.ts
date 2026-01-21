import { get, ref } from "firebase/database";
import { useCallback, useEffect, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";

interface CheckoutRecord {
  reservationCode?: string;
  timestamp?: string;
}

interface CheckoutsNode {
  [dateKey: string]: Record<string, CheckoutRecord>;
}

/**
 * Hook that counts how many checked-out guest records still have
 * active booking data remaining under /bookings.
 */
export default function useArchiveEligibleCount() {
  const database = useFirebaseDatabase();
  const [eligibleCount, setEligibleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!database) {
      setError("Database not initialized.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const checkoutsSnap = await get(ref(database, "checkouts"));
      if (!checkoutsSnap.exists()) {
        setEligibleCount(0);
        setLoading(false);
        return;
      }

      const checkouts = checkoutsSnap.val() as CheckoutsNode;
      const occupantMap: Record<
        string,
        { bookingRef: string; dateKey: string }
      > = {};

      for (const [dateKey, occMap] of Object.entries(checkouts)) {
        for (const [occId, rec] of Object.entries(occMap)) {
          const bookingRef = rec?.reservationCode;
          if (bookingRef) {
            occupantMap[occId] = { bookingRef, dateKey };
          }
        }
      }

      let count = 0;
      const entries = Object.entries(occupantMap);
      for (const [occupantId, { bookingRef }] of entries) {
        const bookingSnap = await get(
          ref(database, `bookings/${bookingRef}/${occupantId}`)
        );
        if (bookingSnap.exists()) {
          count += 1;
        }
      }

      setEligibleCount(count);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [database]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { eligibleCount, loading, error, refresh };
}
