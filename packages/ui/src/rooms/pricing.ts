// src/rooms/pricing.ts
// -----------------------------------------------------------------------------
// Live‑rate pricing helpers for rooms.
// -----------------------------------------------------------------------------

import dayjs from "dayjs";

import type { Room } from "@acme/ui/data/roomsData";
import type { RateCalendar } from "@acme/ui/types/rates";

/**
 * Priority lookup for nightly rate on a given date.
 * Returns `undefined` when calendar is missing or no applicable rate exists.
 */
export const getPriceForDate = (
  room: Room,
  date: Date,
  calendar: RateCalendar | null | undefined
): number | undefined => {
  if (!calendar) return undefined;

  const iso = dayjs(date).format("YYYY-MM-DD");

  const lookup = (code?: string): number | undefined => {
    if (!code?.trim()) return undefined;
    const entry = calendar[code]?.find(({ date }) => date === iso);
    return entry?.nr;
  };

  // 1. direct.nr
  const directPrice = lookup(room.rateCodes.direct?.nr);
  if (directPrice !== undefined) return directPrice;

  // 2. unified widget code (NR === Flex)
  if (
    room.widgetRateCodeNR &&
    room.widgetRateCodeFlex &&
    room.widgetRateCodeNR === room.widgetRateCodeFlex
  ) {
    const unifiedPrice = lookup(room.widgetRateCodeNR);
    if (unifiedPrice !== undefined) return unifiedPrice;
  }

  // 3. flex‑only widget code (NR empty, Flex present)
  if (!room.widgetRateCodeNR && room.widgetRateCodeFlex) {
    const flexOnlyPrice = lookup(room.widgetRateCodeFlex);
    if (flexOnlyPrice !== undefined) return flexOnlyPrice;
  }

  // 4. ota.nr (only if some widget code exists)
  const hasWidgetCodes =
    Boolean(room.widgetRateCodeNR?.trim()) || Boolean(room.widgetRateCodeFlex?.trim());

  if (hasWidgetCodes) {
    const otaPrice = lookup(room.rateCodes.ota?.nr);
    if (otaPrice !== undefined) return otaPrice;
  }

  // 5. room‑level fallback (only when no widget codes exist)
  if (!hasWidgetCodes) {
    const roomPrice = lookup(room.id);
    if (roomPrice !== undefined) return roomPrice;
  }

  // Safety net: try whichever codes remain
  const roomFallback = lookup(room.id);
  if (roomFallback !== undefined) return roomFallback;

  return lookup(room.rateCodes.ota?.nr);
};

