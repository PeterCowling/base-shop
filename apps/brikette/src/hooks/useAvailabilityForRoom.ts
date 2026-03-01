// src/hooks/useAvailabilityForRoom.ts
// Debounced hook that fetches availability for a single room from /api/availability.
// Calls /api/availability (returns all rooms), then filters by room.widgetRoomCode === octorateRoomId.
// Feature-flagged: returns undefined immediately when OCTORATE_LIVE_AVAILABILITY is false.
// Supports AbortController cleanup to prevent setState-after-unmount.

import { useEffect, useRef, useState } from "react";

import { OCTORATE_LIVE_AVAILABILITY } from "@/config/env";
import type { Room } from "@/data/roomsData";
import type { OctorateRoom } from "@/types/octorate-availability";

export type { OctorateRoom };

export interface UseAvailabilityForRoomState {
  availabilityRoom: OctorateRoom | undefined;
  loading: boolean;
  error: Error | null;
}

const DEBOUNCE_MS = 300;

interface UseAvailabilityForRoomArgs {
  room: Room;
  checkIn: string;
  checkOut: string;
  adults: number;
}

const EMPTY_STATE: UseAvailabilityForRoomState = {
  availabilityRoom: undefined,
  loading: false,
  error: null,
};

/**
 * Fetch live availability for a specific room for given dates and guest count.
 *
 * Calls /api/availability (returns all rooms for the dates/pax combination),
 * then filters to the room matching room.widgetRoomCode === octorateRoomId.
 *
 * Debounces 300ms on input change. Returns undefined when:
 * - feature flag is off
 * - dates are empty/invalid
 * - no matching room found in API response
 * - loading or error state
 */
export function useAvailabilityForRoom({
  room,
  checkIn,
  checkOut,
  adults,
}: UseAvailabilityForRoomArgs): UseAvailabilityForRoomState {
  const [state, setState] = useState<UseAvailabilityForRoomState>(EMPTY_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Fast path: feature flag off
    if (!OCTORATE_LIVE_AVAILABILITY) {
      setState(EMPTY_STATE);
      return;
    }

    // Skip fetch when dates are not set
    if (!checkIn || !checkOut) {
      setState(EMPTY_STATE);
      return;
    }

    // Start loading immediately on input change (pre-debounce)
    setState((prev) => ({ ...prev, loading: true, error: null }));

    // Clear previous debounce timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      // Cancel any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      const params = new URLSearchParams({
        checkin: checkIn,
        checkout: checkOut,
        pax: String(adults),
      });

      fetch(`/api/availability?${params.toString()}`, { signal })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`availability fetch failed: ${res.status}`); // i18n-exempt -- BRIK-1 [ttl=2027-02-27] internal error message, server-side only
          }
          return res.json() as Promise<{ rooms: OctorateRoom[]; error?: string }>;
        })
        .then((data) => {
          if (signal.aborted) return;
          const rooms: OctorateRoom[] = data.rooms ?? [];
          // Match by octorateRoomId (data-id attribute) === widgetRoomCode (numeric room code)
          const matched = rooms.find((r) => r.octorateRoomId === room.widgetRoomCode);
          setState({ availabilityRoom: matched, loading: false, error: null });
        })
        .catch((err: unknown) => {
          if (signal.aborted) return;
          setState({
            availabilityRoom: undefined,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        });
    }, DEBOUNCE_MS);

    return () => {
      // Cleanup on unmount or before next effect run
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [checkIn, checkOut, adults, room.widgetRoomCode]);

  return state;
}
