/* File: src/hooks/data/prepare/useCheckinsByDate.ts */

import {
  DataSnapshot,
  endAt,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
  Unsubscribe,
} from "firebase/database";
import { useEffect, useMemo, useRef, useState } from "react";

import { useFirebaseDatabase } from "../../../services/useFirebase";
import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * Represents a single occupant's check‑in record, plus any allocated/booked
 * room information from the `/guestByRoom` node.
 */
export interface OccupantCheckinData {
  occupantId: string;
  reservationCode: string;
  timestamp: string;
  allocated: string | null;
  booked: string | null;
}

/**
 * Final merged shape for check‑ins after including occupant's allocated/booked room.
 */
export interface CheckinsNodeWithAlloc {
  [date: string]: {
    [occupantId: string]: OccupantCheckinData;
  };
}

/** Raw shape of `/checkins` before merging allocated/booked information. */
export interface RawCheckinsNode {
  [date: string]: {
    [occupantId: string]: {
      reservationCode: string;
      timestamp: string;
    };
  };
}

/** Shape of `/guestByRoom` => occupantId -> { allocated, booked }. */
export interface GuestByRoom {
  [occupantId: string]: {
    allocated: string;
    booked: string;
  };
}

export interface UseCheckinsByDateResult {
  /** Merged check‑in data keyed by date. */
  checkins: CheckinsNodeWithAlloc | null;
  /** True while either the check‑ins or guestByRoom subscription is loading. */
  loading: boolean;
  /** Any error from the check‑ins or guestByRoom subscriptions. */
  error: unknown;
}

/**
 * useCheckinsByDate
 *
 * Listens to `/guestByRoom` for occupant → room allocations (a single subscription).
 * Subscribes to `/checkins` within [startDate..endDate] for the provided `dates` array.
 * Merges occupant's room allocation into the final data shape. The hook memoizes
 * subscriptions so that repeated calls with the same date range do not tear down
 * and re‑establish listeners unnecessarily.
 */
export default function useCheckinsByDate(
  dates?: string[]
): UseCheckinsByDateResult {
  const database = useFirebaseDatabase();

  // -----------------------------
  // Check‑ins local state
  // -----------------------------
  const [rawCheckins, setRawCheckins] = useState<RawCheckinsNode | null>(null);
  const [checkinsLoading, setCheckinsLoading] = useState<boolean>(true);
  const [checkinsError, setCheckinsError] = useState<unknown>(null);

  // -----------------------------
  // Occupant allocations (/guestByRoom)
  // -----------------------------
  const {
    data: guestByRoom,
    loading: guestByRoomLoading,
    error: guestByRoomError,
  } = useFirebaseSubscription<GuestByRoom>("guestByRoom");

  // -----------------------------
  // Sort and memoize the array of dates
  // -----------------------------
  const sortedDates = useMemo<string[]>(() => {
    if (!dates || dates.length === 0) return [];
    return [...dates].sort();
  }, [dates]);

  // We'll track the unsubscribe for check‑ins and the current date range in refs
  const unsubCheckinsRef = useRef<Unsubscribe | null>(null);
  const currentRangeRef = useRef<string>(""); // e.g. "2025-03-20--2025-03-22"

  // ---------------------------------------------------------------------
  // 1) Subscribe to `/checkins` for [start..end] if dates are provided
  // ---------------------------------------------------------------------
  useEffect(() => {
    // If no valid dates => unsubscribe if necessary and reset state
    if (sortedDates.length === 0) {
      if (unsubCheckinsRef.current) {
        unsubCheckinsRef.current();
        unsubCheckinsRef.current = null;
      }
      setRawCheckins(null);
      setCheckinsLoading(false);
      setCheckinsError(null);
      currentRangeRef.current = "";
      return;
    }

    // Construct a stable range key based on sortedDates
    const startKey = sortedDates[0];
    const endKey = sortedDates[sortedDates.length - 1];
    const newRangeKey = `${startKey}--${endKey}`;

    // If the range has not changed, mark loading false and avoid resubscribing
    if (newRangeKey === currentRangeRef.current) {
      setCheckinsLoading(false);
      return;
    }

    // A new range is requested => unsubscribe from the old range
    if (unsubCheckinsRef.current) {
      unsubCheckinsRef.current();
      unsubCheckinsRef.current = null;
    }

    // Save the new range key and reset state
    currentRangeRef.current = newRangeKey;
    setRawCheckins(null);
    setCheckinsLoading(true);
    setCheckinsError(null);

    // Build Firebase query for the date range
    const checkinsRef = ref(database, "checkins");
    const rangeQuery = query(
      checkinsRef,
      orderByKey(),
      startAt(startKey),
      endAt(endKey)
    );

    // Callback when data arrives
    const handleSnapshot = (snap: DataSnapshot): void => {
      if (!snap.exists()) {
        setRawCheckins(null);
        setCheckinsLoading(false);
        return;
      }

      // Filter to only the date keys present in sortedDates
      const fullVal = snap.val() as RawCheckinsNode;
      const filtered: RawCheckinsNode = {};
      Object.keys(fullVal).forEach((dateKey) => {
        if (sortedDates.includes(dateKey)) {
          filtered[dateKey] = fullVal[dateKey];
        }
      });

      setRawCheckins(filtered);
      setCheckinsLoading(false);
    };

    // Callback when an error occurs
    const handleError = (err: unknown): void => {
      // eslint-disable-next-line no-console
      console.error("useCheckinsByDate => /checkins error:", err);
      setCheckinsError(err);
      setCheckinsLoading(false);
    };

    // Attach the onValue listener and store the unsubscribe
    const unsubscribe = onValue(rangeQuery, handleSnapshot, handleError);
    unsubCheckinsRef.current = unsubscribe;

    // Cleanup: if this effect runs again with a different range, or on unmount below
    return () => {
      // Intentionally blank – the actual unsubscribe is handled either when
      // the range changes above or on component unmount via the second effect.
    };
  }, [database, sortedDates]);

  // ---------------------------------------------------------------------
  // 2) Unsubscribe on unmount from the final range
  // ---------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (unsubCheckinsRef.current) {
        unsubCheckinsRef.current();
      }
    };
  }, []);

  // ---------------------------------------------------------------------
  // Merge occupant allocations into raw check‑ins
  // ---------------------------------------------------------------------
  const mergedCheckins: CheckinsNodeWithAlloc | null = useMemo(() => {
    if (!rawCheckins) return null;

    const output: CheckinsNodeWithAlloc = {};
    Object.entries(rawCheckins).forEach(([dateKey, occupantMap]) => {
      output[dateKey] = {};
      Object.entries(occupantMap).forEach(([occId, occData]) => {
        const { reservationCode, timestamp, ...rest } = occData;
        const allocInfo = guestByRoom?.[occId] ?? null;

        output[dateKey][occId] = {
          occupantId: occId,
          reservationCode,
          timestamp,
          allocated: allocInfo?.allocated ?? null,
          booked: allocInfo?.booked ?? null,
          ...rest,
        };
      });
    });

    return output;
  }, [rawCheckins, guestByRoom]);

  // ---------------------------------------------------------------------
  // Combine loading & error states
  // ---------------------------------------------------------------------
  const loading = checkinsLoading || guestByRoomLoading;
  const error = checkinsError || guestByRoomError;

  return {
    checkins: mergedCheckins,
    loading,
    error,
  };
}
