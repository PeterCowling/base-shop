import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";

/**
 * useBookingMetaStatuses
 *
 * Fetches booking metadata (status flags) for a list of booking refs.
 * Returns a map of bookingRef -> status ("cancelled" | undefined).
 *
 * Used by CheckinsTable to filter out cancelled bookings.
 */
export default function useBookingMetaStatuses(
  bookingRefs: string[]
): Record<string, string | undefined> {
  const database = useFirebaseDatabase();
  const [statuses, setStatuses] = useState<Record<string, string | undefined>>(
    {}
  );

  // Create stable key for dependency array (content-based, not reference-based)
  const bookingRefsKey = useMemo(
    () => JSON.stringify(bookingRefs),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TASK-10: JSON.stringify creates stable key for array content comparison
    [JSON.stringify(bookingRefs)]
  );

  useEffect(() => {
    if (!database || bookingRefs.length === 0) {
      setStatuses({});
      return;
    }

    const unsubscribers: (() => void)[] = [];

    bookingRefs.forEach((bookingRef) => {
      const statusRef = ref(database, `bookingMeta/${bookingRef}/status`);
      const unsubscribe = onValue(
        statusRef,
        (snapshot) => {
          const status = snapshot.val() as string | null;
          setStatuses((prev) => ({
            ...prev,
            [bookingRef]: status ?? undefined,
          }));
        },
        (error) => {
          console.error(
            `Failed to fetch status for booking ${bookingRef}:`,
            error
          );
        }
      );
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [database, bookingRefsKey, bookingRefs]);

  return statuses;
}
