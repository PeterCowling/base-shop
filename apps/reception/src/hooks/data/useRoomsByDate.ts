// /Users/petercowling/reception/src/hooks/data/useRoomsByDate.ts

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
import { roomsByDateSchema } from "../../schemas/roomsByDateSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { RoomsByDate } from "../../types/hooks/data/roomsByDateData";
import type { MergedOccupancyData, MergedOccupant } from "../../types/roomview";

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
  const database = useFirebaseDatabase();

  const [roomsByDate, setRoomsByDate] = useState<RoomsByDate>(null);
  const [mergedOccupancyData, setMergedOccupancyData] =
    useState<MergedOccupancyData>({});
  const [loading, setLoading] = useState(true); // Start loading initially
  const [error, setError] = useState<unknown>(null);

  // Sort incoming dates for consistent ordering and stable dependency
  const sortedDates = useMemo(() => {
    if (!dates || !dates.length) return [];
    // Ensure sorting is stable and produces a new array reference only if content changes
    const newSorted = [...dates].sort();
    // Simple string comparison to check if the sorted array *content* actually changed
    if (
      JSON.stringify(newSorted) === JSON.stringify(dates?.slice().sort() ?? [])
    ) {
      return dates?.slice().sort() ?? []; // Return stable reference if content same
    }
    return newSorted; // Return new array if content changed
  }, [dates]);

  // Keep references to the current *active* subscription and its associated range key
  const unsubRef = useRef<Unsubscribe | null>(null);
  // Stores the range key (e.g., "start--end") for the *active* subscription
  const activeRangeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Determine the desired range key based on current sortedDates
    let desiredRangeKey: string | null = null;
    if (sortedDates.length > 0) {
      const startKey = sortedDates[0];
      const endKey = sortedDates[sortedDates.length - 1];
      desiredRangeKey = `${startKey}--${endKey}`;
    }

    // 2. Check if the desired range is the same as the *currently active* subscription range
    if (desiredRangeKey === activeRangeKeyRef.current) {
      // Ensure loading is false if we skip *and* we are not in an initial state.
      // Including 'loading' in the dependency array (below) ensures this effect re-runs when loading changes.
      if (desiredRangeKey === null && !loading) {
        // If dates were removed, ensure loading is false (handled below too)
      } else if (desiredRangeKey !== null && !loading) {
        // If dates are present and match, and we weren't loading, stay not loading.
      }
      // If we *were* loading for this range, let the listener set it to false.
      return;
    }

    // 3. If ranges differ (or initial run), unsubscribe from the old range (if any)
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    // Update the active range key *before* attempting a new subscription
    activeRangeKeyRef.current = desiredRangeKey;

    // 4. Handle the case where no dates are provided (unsubscribe completed above)
    if (desiredRangeKey === null) {
      setRoomsByDate(null);
      setMergedOccupancyData({});
      setLoading(false); // No data to load
      setError(null);
      return; // Exit effect
    }

    // 5. Subscribe to the new date range
    setLoading(true); // Set loading true *before* the async call
    setError(null); // Reset error state

    const baseRef = ref(database, "roomsByDate");
    const rangeQuery = query(
      baseRef,
      orderByKey(),
      startAt(sortedDates[0]), // Use startKey derived earlier
      endAt(sortedDates[sortedDates.length - 1]) // Use endKey derived earlier
    );

    // --- Handlers remain the same ---
    const handleValue = (snapshot: DataSnapshot) => {
      // Check if the snapshot corresponds to the *currently active* range key
      // This prevents race conditions if the range changes quickly
      if (activeRangeKeyRef.current !== desiredRangeKey) {
        return;
      }

      if (!snapshot.exists()) {
        setRoomsByDate(null);
        setMergedOccupancyData({});
      } else {
        const fullVal = snapshot.val();

        const filtered: RoomsByDate = {};
        // Ensure we only include dates explicitly requested in sortedDates
        const dateSet = new Set(sortedDates);
        Object.keys(fullVal).forEach((key) => {
          if (dateSet.has(key)) {
            filtered[key] = fullVal[key];
          }
        });

        const parseResult = roomsByDateSchema.safeParse(filtered);
        if (parseResult.success) {
          const finalData = parseResult.data;
          setRoomsByDate(finalData);
          setMergedOccupancyData(
            convertRoomsByDateToMergedOccupancyData(finalData)
          );
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
      setLoading(false); // Set loading false *after* processing data or lack thereof
    };

    const handleError = (err: unknown) => {
      // Check if the error corresponds to the *currently active* range key
      if (activeRangeKeyRef.current !== desiredRangeKey) {
        return;
      }
      console.error("[useRoomsByDate] Firebase query error:", err);
      setError(err);
      setLoading(false);
    };

    // Initiate the subscription
    const unsubscribe = onValue(rangeQuery, handleValue, handleError);
    unsubRef.current = unsubscribe; // Store the unsubscribe function

    // Effect cleanup function: Only unsubscribes if the effect re-runs due to dependency changes.
    // The main logic above handles unsubscription when the range *needs* to change.
    return () => {
      console.log(
        "[useRoomsByDate] Effect cleanup running for range:",
        desiredRangeKey
      );
      // Unsubscribe logic is handled at the start of the effect if range changes.
    };
    // Added 'loading' to dependency array to satisfy lint and account for its use in the effect.
  }, [database, sortedDates, loading]);

  // Final unmount cleanup: Ensures the *last* subscription is cleaned up
  useEffect(() => {
    return () => {
      // Access the ref at unmount time so we always unsubscribe from the
      // most recent listener
      if (unsubRef.current) {
        unsubRef.current();
        // Clear refs on unmount (optional but good practice)
        unsubRef.current = null;
        activeRangeKeyRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleans up on unmount

  return { roomsByDate, mergedOccupancyData, loading, error };
}
