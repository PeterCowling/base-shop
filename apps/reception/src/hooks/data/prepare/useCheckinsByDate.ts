/* File: src/hooks/data/prepare/useCheckinsByDate.ts */

import { useCallback, useMemo, useState } from "react";
import type { DataSnapshot } from "firebase/database";

import useFirebaseSubscription from "../useFirebaseSubscription";
import { useRangeSubscription } from "../useRangeSubscription";

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

  // -----------------------------
  // Range subscription callbacks
  // -----------------------------
  const handleSnapshot = useCallback(
    (snap: DataSnapshot): void => {
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
    },
    [sortedDates]
  );

  const handleError = useCallback((err: unknown): void => {
    setCheckinsError(err);
    setCheckinsLoading(false);
  }, []);

  // ---------------------------------------------------------------------
  // Range subscription — delegates subscription lifecycle to the primitive
  // ---------------------------------------------------------------------
  useRangeSubscription("checkins", sortedDates, {
    onSnapshot: handleSnapshot,
    onError: handleError,
  });

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
