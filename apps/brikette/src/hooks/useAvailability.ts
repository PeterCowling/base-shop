// src/hooks/useAvailability.ts
// Debounced hook that fetches per-room live availability from /api/availability.
// Feature-flagged: returns empty immediately when OCTORATE_LIVE_AVAILABILITY is false.
// Delegates debounce+fetch+cleanup to useAvailabilityQuery.

import { OCTORATE_LIVE_AVAILABILITY } from "@/config/env";
import type { OctorateRoom } from "@/types/octorate-availability";

import { type AvailabilityQueryState,useAvailabilityQuery } from "./useAvailabilityQuery";

export type { OctorateRoom };

export type AvailabilityState = AvailabilityQueryState;

interface UseAvailabilityArgs {
  checkin: string;
  checkout: string;
  pax: string | number;
}

/**
 * Fetch per-room live availability for a given date range and pax count.
 *
 * Debounces 300ms on checkin/checkout/pax change. Returns empty immediately
 * when the OCTORATE_LIVE_AVAILABILITY feature flag is disabled.
 *
 * Consumers match rooms by `octorateRoomName === room.widgetRoomCode`.
 */
export function useAvailability({
  checkin,
  checkout,
  pax,
}: UseAvailabilityArgs): AvailabilityState {
  return useAvailabilityQuery({
    checkin,
    checkout,
    pax,
    enabled: OCTORATE_LIVE_AVAILABILITY,
  });
}
