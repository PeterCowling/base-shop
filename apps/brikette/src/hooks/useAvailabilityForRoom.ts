// src/hooks/useAvailabilityForRoom.ts
// Debounced hook that fetches availability for a single room from /api/availability.
// Calls /api/availability (returns all rooms), then aggregates sections by room.octorateRoomCategory.
// Feature-flagged: returns undefined immediately when OCTORATE_LIVE_AVAILABILITY is false.
// Delegates debounce+fetch+cleanup to useAvailabilityQuery.

import { OCTORATE_LIVE_AVAILABILITY } from "@/config/env";
import type { Room } from "@/data/roomsData";
import type { OctorateRoom } from "@/types/octorate-availability";
import { aggregateAvailabilityByCategory } from "@/utils/aggregateAvailabilityByCategory";

import { useAvailabilityQuery } from "./useAvailabilityQuery";

export type { OctorateRoom };

export interface UseAvailabilityForRoomState {
  availabilityRoom: OctorateRoom | undefined;
  loading: boolean;
  error: Error | null;
}

interface UseAvailabilityForRoomArgs {
  room: Room;
  checkIn: string;
  checkOut: string;
  adults: number;
}

/**
 * Fetch live availability for a specific room for given dates and guest count.
 *
 * Calls /api/availability (returns all rooms for the dates/pax combination),
 * then aggregates sections by room.octorateRoomCategory (name-based matching).
 *
 * Debounces 300ms on input change. Returns undefined when:
 * - feature flag is off
 * - dates are empty/invalid
 * - no matching category found in API response
 * - loading or error state
 */
export function useAvailabilityForRoom({
  room,
  checkIn,
  checkOut,
  adults,
}: UseAvailabilityForRoomArgs): UseAvailabilityForRoomState {
  const enabled = OCTORATE_LIVE_AVAILABILITY && !!checkIn && !!checkOut;

  const { rooms, loading, error } = useAvailabilityQuery({
    checkin: checkIn,
    checkout: checkOut,
    pax: adults,
    enabled,
  });

  if (!enabled) {
    return { availabilityRoom: undefined, loading: false, error: null };
  }
  if (loading) {
    return { availabilityRoom: undefined, loading: true, error: null };
  }
  if (error) {
    return { availabilityRoom: undefined, loading: false, error };
  }
  const matched = aggregateAvailabilityByCategory(rooms, room.octorateRoomCategory ?? "");
  return { availabilityRoom: matched, loading: false, error: null };
}
