// /Users/petercowling/reception/src/hooks/data/useRoomsByDate.ts
/* eslint-disable ds/no-raw-color -- default room occupancy color is domain data constant [REC-09] */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DataSnapshot } from "firebase/database";

import {
  getCachedData,
  setCachedData,
} from "../../lib/offline/receptionDb";
import { roomsByDateSchema } from "../../schemas/roomsByDateSchema";
import type { RoomsByDate } from "../../types/hooks/data/roomsByDateData";
import type { MergedOccupancyData, MergedOccupant } from "../../types/roomview";

import { useRangeSubscription } from "./useRangeSubscription";

const ROOMS_CACHE_KEY = "roomsByDate";

interface RoomsByDateCacheEntry {
  roomsByDate: RoomsByDate;
  mergedOccupancyData: MergedOccupancyData;
}

// --- RoomByDateBooking interface remains the same ---
interface RoomByDateBooking {
  occupantId: string;
  bookingRef: string;
  fullName?: string;
  startIndex?: number;
  endIndex?: number;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
  color?: string;
}

// --- toMergedOccupants function remains the same ---
function toMergedOccupants(
  occupantData: unknown,
  dateKey: string,
  roomNumberKey: string | number
): MergedOccupant[] {
  if (!occupantData) return [];

  if (Array.isArray(occupantData)) {
    return occupantData.map((item) => ({
      ...item,
      start:
        (item as MergedOccupant).start ??
        (item as MergedOccupant).checkInDate ??
        dateKey,
      end:
        (item as MergedOccupant).end ??
        (item as MergedOccupant).checkOutDate ??
        dateKey,
    })) as MergedOccupant[];
  }

  const occupantMap = occupantData as Record<string, RoomByDateBooking>;

  return Object.values(occupantMap).map((raw) => ({
    occupantId: raw.occupantId,
    bookingRef: raw.bookingRef,
    roomNumber: roomNumberKey,
    date: dateKey,
    fullName: raw.fullName ?? "Unknown",
    startIndex: raw.startIndex ?? 0,
    endIndex: raw.endIndex ?? 0,
    checkInDate: raw.checkInDate ?? dateKey,
    checkOutDate: raw.checkOutDate ?? dateKey,
    numberOfGuests: raw.numberOfGuests ?? 1,
    color: raw.color ?? "#cccccc",
    start: raw.checkInDate ?? dateKey,
    end: raw.checkOutDate ?? dateKey,
  }));
}

// --- convertRoomsByDateToMergedOccupancyData function remains the same ---
function convertRoomsByDateToMergedOccupancyData(
  roomsByDate: RoomsByDate
): MergedOccupancyData {
  if (!roomsByDate) return {};
  const merged: MergedOccupancyData = {};

  Object.entries(roomsByDate).forEach(([date, roomsObj]) => {
    if (!roomsObj) return;
    merged[date] = {};

    Object.entries(roomsObj).forEach(([roomNumber, occupantData]) => {
      merged[date][roomNumber] = toMergedOccupants(
        occupantData,
        date,
        roomNumber
      );
    });
  });

  return merged;
}

export interface UseRoomsByDateResult {
  roomsByDate: RoomsByDate;
  mergedOccupancyData: MergedOccupancyData;
  loading: boolean;
  error: unknown;
}

/**
 * A real-time subscription hook for roomsByDate, restricted by the given date range.
 * - Subscribes when dates are first provided or when the date range changes.
 * - Avoids re-subscribing if the date range remains identical to the currently active subscription.
 * - Unsubscribes on unmount or when the date range changes.
 */
export default function useRoomsByDate(dates?: string[]): UseRoomsByDateResult {
  const [roomsByDate, setRoomsByDate] = useState<RoomsByDate>(null);
  const [mergedOccupancyData, setMergedOccupancyData] =
    useState<MergedOccupancyData>({});
  const [loading, setLoading] = useState(true); // Start loading initially
  const [error, setError] = useState<unknown>(null);

  // Sort incoming dates for consistent ordering.
  const sortedDates = useMemo(() => {
    if (!dates || !dates.length) return [];
    return [...dates].sort();
  }, [dates]);

  // Derive a stable string range key from sortedDates. Because this is a
  // primitive string, useEffect deps compare by value — identical start/end
  // dates from a new array reference will NOT trigger a new subscription.
  const rangeKey = useMemo<string | null>(() => {
    if (sortedDates.length === 0) return null;
    return `${sortedDates[0]}--${sortedDates[sortedDates.length - 1]}`;
  }, [sortedDates]);

  // Track the previous range key so we reset loading/data state only when the
  // range genuinely changes — not on every render when dates is an inline literal.
  const prevRangeKeyRef = useRef<string | null | undefined>(undefined);

  // IndexedDB prefill — runs once on mount; Firebase will overwrite when online.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cached = await getCachedData<RoomsByDateCacheEntry>(ROOMS_CACHE_KEY);
      if (!cancelled && cached) {
        setRoomsByDate(cached.roomsByDate);
        setMergedOccupancyData(cached.mergedOccupancyData);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset loading/data state when the active range key changes. Because rangeKey
  // is a string primitive, this effect only fires when the range genuinely changes.
  useEffect(() => {
    if (rangeKey === prevRangeKeyRef.current) return;
    prevRangeKeyRef.current = rangeKey;

    if (rangeKey === null) {
      setRoomsByDate(null);
      setMergedOccupancyData({});
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }
  }, [rangeKey]);

  const handleSnapshot = useCallback(
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        setRoomsByDate(null);
        setMergedOccupancyData({});
      } else {
        const fullVal = snapshot.val();

        const filtered: RoomsByDate = {};
        const dateSet = new Set(sortedDates);
        Object.keys(fullVal).forEach((key) => {
          if (dateSet.has(key)) {
            filtered[key] = fullVal[key];
          }
        });

        const parseResult = roomsByDateSchema.safeParse(filtered);
        if (parseResult.success) {
          const finalData = parseResult.data;
          const mergedData = convertRoomsByDateToMergedOccupancyData(finalData);
          setRoomsByDate(finalData);
          setMergedOccupancyData(mergedData);
          // Fire-and-forget cache update
          void setCachedData<RoomsByDateCacheEntry>(ROOMS_CACHE_KEY, {
            roomsByDate: finalData,
            mergedOccupancyData: mergedData,
          });
        } else {
          console.error(
            "[useRoomsByDate] Schema parse error",
            parseResult.error
          );
          setError(parseResult.error);
          setRoomsByDate(null);
          setMergedOccupancyData({});
        }
      }
      setLoading(false);
    },
    [sortedDates]
  );

  const handleError = useCallback((err: unknown) => {
    console.error("[useRoomsByDate] Firebase query error:", err);
    setError(err);
    setLoading(false);
  }, []);

  useRangeSubscription("roomsByDate", sortedDates, {
    onSnapshot: handleSnapshot,
    onError: handleError,
  });

  return { roomsByDate, mergedOccupancyData, loading, error };
}
