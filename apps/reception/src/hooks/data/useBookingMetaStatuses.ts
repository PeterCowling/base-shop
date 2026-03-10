import { useEffect, useMemo, useState } from "react";
import { onValue, ref } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";

/**
 * useBookingMetaStatuses
 *
 * Fetches booking metadata (status flags) for a list of booking refs.
 * Returns a map of bookingRef -> status ("cancelled" | undefined).
 *
 * Uses a single subtree listener on the /bookingMeta root and filters
 * client-side to only the requested refs, reducing Firebase listener count
 * from N (one per booking) to 1 regardless of how many refs are provided.
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

    // Reset when the ref set changes to avoid stale entries from a previous ref set.
    setStatuses({});

    // Single subtree listener on the bookingMeta root.
    // The snapshot delivers the full bookingMeta subtree; we extract only the
    // requested refs client-side, keeping the returned map bounded.
    const rootRef = ref(database, "bookingMeta");

    const unsubscribe = onValue(
      rootRef,
      (snapshot) => {
        const snapshotVal = (snapshot.val() ?? {}) as Record<
          string,
          { status?: string } | undefined
        >;

        setStatuses((prev) => {
          const next: Record<string, string | undefined> = {};
          let changed = false;

          for (const bookingRef of bookingRefsStable) {
            const status = snapshotVal[bookingRef]?.status ?? undefined;
            next[bookingRef] = status;
            if (prev[bookingRef] !== status) {
              changed = true;
            }
          }

          // Only update state if something actually changed to avoid
          // triggering unnecessary re-renders.
          if (!changed && Object.keys(prev).length === bookingRefsStable.length) {
            return prev;
          }
          return next;
        });
      },
      (error) => {
        console.error("Failed to fetch bookingMeta statuses:", error);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [database, bookingRefsStable]);

  return statuses;
}
