// src/hooks/useAvailabilityQuery.ts
// Shared debounce+AbortController+fetch utility for availability hooks.
// Both useAvailability and useAvailabilityForRoom compose on top of this utility.
// Not intended for direct use by components — use the specific hooks instead.

import { useEffect, useRef, useState } from "react";

import type { OctorateRoom } from "@/types/octorate-availability";

export interface AvailabilityQueryState {
  rooms: OctorateRoom[];
  loading: boolean;
  error: Error | null;
}

export interface UseAvailabilityQueryArgs {
  checkin: string;
  checkout: string;
  pax: string | number;
  /** When false, the hook returns EMPTY_STATE immediately without fetching. */
  enabled: boolean;
}

const DEBOUNCE_MS = 300;

const EMPTY_STATE: AvailabilityQueryState = {
  rooms: [],
  loading: false,
  error: null,
};

/**
 * Low-level availability fetch hook with debounce and AbortController cleanup.
 *
 * When `enabled` is false, returns EMPTY_STATE immediately — no fetch, no timer.
 * Both the feature-flag guard and the empty-dates guard belong in the consuming
 * hook, not here. The consuming hook computes `enabled` and passes it in.
 */
export function useAvailabilityQuery({
  checkin,
  checkout,
  pax,
  enabled,
}: UseAvailabilityQueryArgs): AvailabilityQueryState {
  const [state, setState] = useState<AvailabilityQueryState>(EMPTY_STATE);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_STATE);
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
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
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [checkin, checkout, pax, enabled]);

  return state;
}
