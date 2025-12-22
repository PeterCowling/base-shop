// src/rooms/availability.ts
// -----------------------------------------------------------------------------
// Availability helpers for rooms (sold-out checks, etc.).
// -----------------------------------------------------------------------------

import type { Room } from "@/data/roomsData";
import type { RateCalendar } from "@/types/rates";
import { getPriceForDate } from "./pricing";

/**
 * Returns true when the room is sold‑out (no live rate for the date).
 */
export const isSoldOut = (
  room: Room,
  date: Date,
  calendar: RateCalendar | null | undefined
): boolean => getPriceForDate(room, date, calendar) === undefined;

