/**
 * useRangeSubscription
 *
 * A stateless primitive that manages a single Firebase range subscription keyed by a
 * sorted date array. It encapsulates the deduplication pattern (skip when range is
 * unchanged), unsubscription when the range changes, and final cleanup on unmount.
 *
 * The hook owns NO state. Callers supply stable `onSnapshot` and `onError` callbacks
 * (or any value — the hook holds them in refs so updates never cause re-subscription).
 *
 * IMPORTANT: `sortedDates` must be a pre-sorted array. The hook computes a stable
 * string range key from `sortedDates[0]` and `sortedDates[last]` as its dep — callers
 * are responsible for sorting before passing dates in.
 */

import { useEffect, useMemo, useRef } from "react";
import {
  type DataSnapshot,
  endAt,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
  type Unsubscribe,
} from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";

export interface UseRangeSubscriptionOptions {
  onSnapshot: (snapshot: DataSnapshot) => void;
  onError?: (err: unknown) => void;
}

/**
 * Subscribe to a Firebase range query for `<path>` ordered by key, bounded by
 * `[sortedDates[0], sortedDates[last]]`. When `sortedDates` is empty the hook
 * unsubscribes and becomes idle. Re-renders with the same computed range key
 * (i.e. same start and end date) do not create a new subscription.
 */
export function useRangeSubscription(
  path: string,
  sortedDates: string[],
  { onSnapshot, onError }: UseRangeSubscriptionOptions
): void {
  const database = useFirebaseDatabase();

  // Stable refs for callbacks — updating these never triggers re-subscription.
  const onSnapshotRef = useRef(onSnapshot);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onSnapshotRef.current = onSnapshot;
  });
  useEffect(() => {
    onErrorRef.current = onError;
  });

  // Keep a snapshot of sortedDates for use inside the subscription closure
  // without making it a dep of the main effect.
  const sortedDatesRef = useRef(sortedDates);
  useEffect(() => {
    sortedDatesRef.current = sortedDates;
  });

  // Derive a string range key so the subscription effect dep is stable even
  // when the caller passes a new array reference with the same content.
  // Since rangeKey is a primitive string, React's effect dep comparison
  // is by value, not by reference.
  const rangeKey = useMemo<string | null>(() => {
    if (sortedDates.length === 0) return null;
    return `${sortedDates[0]}--${sortedDates[sortedDates.length - 1]}`;
  }, [sortedDates]);

  // Track the currently active subscription.
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // Tear down any existing subscription before starting a new one.
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    // Nothing to subscribe to when no dates are provided.
    if (rangeKey === null) {
      return;
    }

    const dates = sortedDatesRef.current;
    const baseRef = ref(database, path);
    const rangeQuery = query(
      baseRef,
      orderByKey(),
      startAt(dates[0]),
      endAt(dates[dates.length - 1])
    );

    // Use a cancelled flag to guard against late-arriving snapshots after
    // the subscription has been torn down (e.g. fast range changes).
    let cancelled = false;

    const handleSnapshot = (snapshot: DataSnapshot): void => {
      if (cancelled) return;
      onSnapshotRef.current(snapshot);
    };

    const handleError = (err: unknown): void => {
      if (cancelled) return;
      onErrorRef.current?.(err);
    };

    unsubRef.current = onValue(rangeQuery, handleSnapshot, handleError);

    return () => {
      cancelled = true;
    };
  }, [database, path, rangeKey]);

  // Unmount cleanup — tears down the last active subscription.
  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);
}
