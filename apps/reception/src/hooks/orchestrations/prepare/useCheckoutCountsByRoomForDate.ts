// File: src/hooks/orchestrations/prepare/useCheckoutCountsByRoomForDate.ts

import { useEffect, useMemo, useState } from "react";

import { useGuestByRoom } from "./useGuestByRoom";
import {
  addDays,
  getItalyLocalTimeHHMM,
  getLocalYyyyMmDd,
  parseLocalDate,
} from "../../../utils/dateUtils";
import { useCheckouts } from "../../data/useCheckouts";

/**
 * Data Orchestrator Hook:
 * Aggregates occupant checkouts by room for a given selected date.
 *
 * 1. If local Italy time is past 12:00, we shift 'selectedDate' to the *next* day,
 *    to reflect that all checkouts for the current day are already completed.
 * 2. We look up all occupant IDs in 'checkouts[adjustedDate]'.
 * 3. For each occupantId, retrieve that occupant's allocated room from guestByRoom.
 * 4. Count how many occupant checkouts fall in each room.
 *
 * Returns a dictionary: { roomNumber: checkoutCount }.
 */
export function useCheckoutCountsByRoomForDate(selectedDate: string) {
  const {
    checkouts,
    loading: checkoutsLoading,
    error: checkoutsError,
  } = useCheckouts();
  const {
    guestByRoom,
    loading: guestByRoomLoading,
    error: guestByRoomError,
  } = useGuestByRoom();

  const [checkoutCountsByRoom, setCheckoutCountsByRoom] = useState<
    Record<string, number>
  >({});

  // Decide whether to shift today's date to tomorrow if it's past midday in Italy.
  const adjustedDate = useMemo(() => {
    const timeHHMM = getItalyLocalTimeHHMM(); // "HH:MM" in Italy
    if (timeHHMM >= "12:00") {
      // Shift date to the next day
      const baseDate = parseLocalDate(selectedDate) ?? new Date();
      const nextDay = addDays(baseDate, 1);
      return getLocalYyyyMmDd(nextDay);
    }
    return selectedDate;
  }, [selectedDate]);

  useEffect(() => {
    if (!checkouts || !guestByRoom) {
      setCheckoutCountsByRoom({});
      return;
    }
    const occupantRecords = checkouts[adjustedDate];
    if (!occupantRecords) {
      setCheckoutCountsByRoom({});
      return;
    }

    const tempCounts: Record<string, number> = {};
    Object.entries(occupantRecords).forEach(([occupantId]) => {
      const occupantInfo = guestByRoom[occupantId];
      if (occupantInfo) {
        const { allocated } = occupantInfo;
        if (!tempCounts[allocated]) {
          tempCounts[allocated] = 0;
        }
        tempCounts[allocated] += 1;
      }
    });

    setCheckoutCountsByRoom(tempCounts);
  }, [adjustedDate, checkouts, guestByRoom]);

  const loading = checkoutsLoading || guestByRoomLoading;
  const error = checkoutsError || guestByRoomError;

  return {
    checkoutCountsByRoom,
    loading,
    error,
  };
}
