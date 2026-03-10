// src/hooks/useAvailability.ts
// Debounced hook that fetches per-room live availability from /api/availability.
// Feature-flagged: returns empty immediately when OCTORATE_LIVE_AVAILABILITY is false.
// Supports AbortController cleanup to prevent setState-after-unmount.

import { useEffect, useRef, useState } from "react";

import { OCTORATE_LIVE_AVAILABILITY } from "@/config/env";
import type { OctorateRoom } from "@/types/octorate-availability";

export type { OctorateRoom };

export interface AvailabilityState {
  rooms: OctorateRoom[];
  loading: boolean;
  error: Error | null;
}

const DEBOUNCE_MS = 300;

interface UseAvailabilityArgs {
  checkin: string;
  checkout: string;
  pax: string | number;
}

const EMPTY_STATE: AvailabilityState = {
  rooms: [],
  loading: false,
  error: null,
};

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
  const [state, setState] = useState<AvailabilityState>(EMPTY_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Fast path: feature flag off
    if (!OCTORATE_LIVE_AVAILABILITY) {
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
        checkin: String(checkin),
        checkout: String(checkout),
        pax: String(pax),
      });

      fetch(`/api/availability?${params.toString()}`, { signal })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`availability fetch failed: ${res.status}`); // i18n-exempt -- BRIK-1 [ttl=2027-02-27] internal error message, server-side only
          }
          return res.json() as Promise<{ rooms: OctorateRoom[]; error?: string }>;
        })
        .then((data) => {
          if (!signal.aborted) {
            setState({ rooms: data.rooms ?? [], loading: false, error: null });
          }
        })
        .catch((err: unknown) => {
          if (signal.aborted) return;
          setState({
            rooms: [],
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
  }, [checkin, checkout, pax]);

  return state;
}
