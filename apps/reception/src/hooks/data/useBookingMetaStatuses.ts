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
  bookingRefs: readonly string[],
): Record<string, string | undefined> {
  const database = useFirebaseDatabase();
  const [statuses, setStatuses] = useState<Record<string, string | undefined>>({});

  // Content-derived key: callers sometimes pass inline arrays, so we can't use reference equality.
  const bookingRefsKey = useMemo(() => JSON.stringify(bookingRefs), [bookingRefs]);

  // Stable array instance for the effect dependency list.
  const bookingRefsStable = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(bookingRefsKey);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }, [bookingRefsKey]);

  useEffect(() => {
    if (!database || bookingRefsStable.length === 0) {
      setStatuses({});
      return;
    }

    // Reset when the ref set changes to avoid stale entries.
    setStatuses({});

    const unsubscribers: Array<() => void> = [];

    for (const bookingRef of bookingRefsStable) {
      const statusRef = ref(database, `bookingMeta/${bookingRef}/status`);
      const unsubscribe = onValue(
        statusRef,
        (snapshot) => {
          const status = snapshot.val() as string | null;
          setStatuses((prev) => {
            const next = status ?? undefined;
            if (prev[bookingRef] === next) {
              return prev;
            }
            return { ...prev, [bookingRef]: next };
          });
        },
        (error) => {
          console.error(`Failed to fetch status for booking ${bookingRef}:`, error);
        },
      );
      unsubscribers.push(unsubscribe);
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [database, bookingRefsStable]);

  return statuses;
}
