// src/hooks/useRoomPricing.ts
// =============================================================================
// Custom hook that wraps all price / availability logic for a single room.
// Added DEBUG logging so we can trace why ↘︎priceFrom is not appearing.
// =============================================================================

import { useMemo } from "react";

import { useRates } from "@/context/RatesContext";
import type { Room } from "@/data/roomsData";
import { getPriceForDate } from "@/rooms/pricing";
import { getToday, getTodayIso } from "@/utils/dateUtils";

export interface RoomPricing {
  lowestPrice?: number;
  soldOut: boolean;
  loading: boolean;
  error?: Error;
}

export function useRoomPricing(room: Room): RoomPricing {
  const { rates, loading, error } = useRates();

  // Stable reference to “today at local midnight”
  const today = useMemo(getToday, []);

  /** Live nightly rate for **today**. */
  const livePrice = useMemo(() => getPriceForDate(room, today, rates), [room, today, rates]);

  /** Fallback to catalogue `basePrice` once rates have finished loading. */
  const lowestPrice = useMemo<number | undefined>(() => {
    if (livePrice !== undefined) return livePrice; // got a live rate
    if (!loading && room.basePrice) return room.basePrice.amount; // fallback
    return undefined; // still loading, or missing `basePrice`
  }, [livePrice, loading, room.basePrice]);

  /**
   * Calendar is "fresh" when at least one entry covers today or a future date.
   * A stale calendar (all entries in the past) means we lack data to determine
   * availability — we should not mark the room as sold out in that case.
   */
  const calendarIsFresh = useMemo(() => {
    if (!rates) return false;
    const todayIso = getTodayIso();
    return Object.values(rates).some(
      (entries) => Array.isArray(entries) && entries.some((e) => e.date >= todayIso),
    );
  }, [rates]);

  /** Sold‑out only when the calendar is fresh, we’re done loading, & no live rate exists. */
  const soldOut = useMemo(
    () => !loading && calendarIsFresh && livePrice === undefined,
    [loading, calendarIsFresh, livePrice],
  );

  return {
    soldOut,
    loading,
    ...(lowestPrice !== undefined ? { lowestPrice } : {}),
    ...(error !== undefined ? { error } : {}),
  };
}
