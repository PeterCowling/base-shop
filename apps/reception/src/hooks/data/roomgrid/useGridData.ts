// File: src/hooks/data/roomgrid/useGridData.ts

import { useCallback, useMemo } from "react";
import {
  dateRangesOverlap,
  generateDateRange,
  sortByDateAsc,
  toEpochMillis,
} from "../../../utils/dateUtils";

import useActivitiesData, { type IActivity } from "./useActivitiesData";
import useBookingsData from "./useBookingsData";
import useGuestByRoomData from "./useGuestByRoomData";
import useGuestsDetailsData from "./useGuestsDetailsData";
import { statusColors } from "../../../components/roomgrid/constants/statusColors";
import type { TRow } from "../../../components/roomgrid/interfaces/row";
import type { MyLocalStatus } from "../../../types/MyLocalStatus";
import useRoomConfigs from "../../client/checkin/useRoomConfigs";

/** TPeriod uses MyLocalStatus only. */
export type TPeriod = {
  start: string;
  end: string;
  status: MyLocalStatus;
};

/**
 * Extended booking period type that includes occupant + booking info.
 */
export type TBookingPeriod = TPeriod & {
  bookingRef: string;
  occupantId: string;
  firstName: string;
  lastName: string;
  info: string; // Optional descriptor
  color: string; // For UI highlighting
};

/**
 * Each row for the Reservation Grid.
 */
export interface GridReservationRow extends TRow<MyLocalStatus> {
  /** Unique row identifier */
  id: string;
  /** Display title, e.g. occupant name or bed label */
  title: string;
  /** Aggregated info string (e.g., comma‑separated booking IDs) */
  info: string;
  startDate: string;
  endDate: string;
  color?: string; // Optional override
  periods: TBookingPeriod[];
}

/**
 * Determine if two date ranges overlap.
 * The dates are provided as ISO strings (yyyy-MM-dd). The comparison is done
 * using parsed timestamps for reliability.
 */
/**
 * Arrange booking rows so that overlapping bookings occupy separate rows.
 *
 * The resulting array will have a row per bed up to `bedCount`.
 * Additional overlapping bookings are placed into "overbooked" rows.
 */
export function packBookingsIntoRows(
  bookings: GridReservationRow[],
  bedCount: number
): GridReservationRow[] {
  const sanitized = bookings.filter((booking) => {
    const firstPeriod = booking.periods?.[0];
    const hasStart = Boolean(firstPeriod?.start);
    const hasEnd = Boolean(firstPeriod?.end);

    if (!hasStart || !hasEnd) {
      console.error("[packBookingsIntoRows] Skipping booking with missing period", {
        bookingId: booking.id,
        periods: booking.periods,
      });
    }

    return hasStart && hasEnd;
  });

  if (sanitized.length === 0) {
    return [];
  }

  // Sort by the earliest period start
  const sortedBookings = sortByDateAsc([...sanitized], (b) => b.periods[0].start);

  const rows: GridReservationRow[] = [];

  for (const booking of sortedBookings) {
    const [newPeriod] = booking.periods;
    const newStart = newPeriod.start;
    const newEnd = newPeriod.end;
    let placed = false;

    for (const row of rows) {
      let overlap = false;
      for (const ep of row.periods) {
        if (dateRangesOverlap(ep.start, ep.end, newStart, newEnd)) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        row.periods.push(newPeriod);
        if (newStart < row.startDate) row.startDate = newStart;
        if (newEnd > row.endDate) row.endDate = newEnd;
        row.info = row.info ? `${row.info}, ${booking.id}` : booking.id;
        placed = true;
        break;
      }
    }

    if (!placed) {
      const index = rows.length;
      const base: Omit<GridReservationRow, "id" | "title"> = {
        info: booking.id,
        periods: [newPeriod],
        startDate: newStart,
        endDate: newEnd,
        color: newPeriod.color,
      };

      if (index < bedCount) {
        rows.push({
          ...base,
          id: `bed-${index + 1}`,
          title: `Bed #${index + 1}`,
        });
      } else {
        const overIdx = index - bedCount + 1;
        rows.push({
          ...base,
          id: `overbooked-${overIdx}`,
          title: `Overbook #${overIdx}`,
        });
      }
    }
  }

  return rows;
}

const getActivityStatus = (
  occActs: { [activityId: string]: IActivity } | undefined
): MyLocalStatus => {
  if (!occActs) return "1";
  const list = Object.values(occActs).sort(
    (a, b) => toEpochMillis(b.timestamp) - toEpochMillis(a.timestamp)
  );
  if (!list.length) return "1";
  const precedence: MyLocalStatus[] = ["1", "8", "12", "14", "16"];
  let best: MyLocalStatus = "1";
  let bestIdx = -1;
  for (const act of list) {
    const code = String(act.code) as MyLocalStatus;
    const idx = precedence.indexOf(code);
    if (idx > bestIdx) {
      bestIdx = idx;
      best = code;
    }
  }
  return best;
};

const getStatusColor = (status: MyLocalStatus): string => {
  return statusColors[status] ?? "#1E90FF";
};

export default function useGridData(startDate: string, endDate: string) {
  const { knownRooms, getBedCount } = useRoomConfigs();

  const {
    bookingsData,
    loading: bookingsLoading,
    error: bookingsError,
  } = useBookingsData();
  const {
    guestsDetailsData,
    loading: guestsLoading,
    error: guestsError,
  } = useGuestsDetailsData();
  const {
    guestByRoomData,
    loading: guestByRoomLoading,
    error: guestByRoomError,
  } = useGuestByRoomData();
  const {
    activitiesData,
    loading: activitiesLoading,
    error: activitiesError,
  } = useActivitiesData();

  const loading =
    bookingsLoading || guestsLoading || guestByRoomLoading || activitiesLoading;

  const error =
    bookingsError || guestsError || guestByRoomError || activitiesError || null;

  const allRoomData = useMemo<Record<string, GridReservationRow[]>>(() => {
    const result: Record<string, GridReservationRow[]> = {};

    knownRooms.forEach((room) => {
      const beds = getBedCount(room) || 1;
      const rows: GridReservationRow[] = [];

      console.log("[useGridData] Processing room", room, {
        beds,
        startDate,
        endDate,
      });

      Object.entries(bookingsData).forEach(([ref, occMap]) => {
        Object.entries(occMap).forEach(([occId, data]) => {
          if (guestByRoomData[occId]?.allocated !== room) return;

          if (!data?.checkInDate || !data?.checkOutDate) {
            console.error("[useGridData] Missing booking dates", {
              bookingRef: ref,
              occupantId: occId,
              checkInDate: data?.checkInDate,
              checkOutDate: data?.checkOutDate,
            });
            return;
          }

          if (data.checkOutDate < startDate || data.checkInDate > endDate) {
            return;
          }

          if (data.checkInDate >= data.checkOutDate) {
            console.error("[useGridData] Invalid booking date range", {
              bookingRef: ref,
              occupantId: occId,
              checkInDate: data.checkInDate,
              checkOutDate: data.checkOutDate,
            });
            return;
          }

          const firstName = guestsDetailsData?.[ref]?.[occId]?.firstName || "";
          const lastName = guestsDetailsData?.[ref]?.[occId]?.lastName || "";
          const status = getActivityStatus(activitiesData[occId]);
          const color = getStatusColor(status);

          const period: TBookingPeriod = {
            start: data.checkInDate,
            end: data.checkOutDate,
            status,
            bookingRef: ref,
            occupantId: occId,
            firstName,
            lastName,
            info: `${firstName} ${lastName} (Status: ${status})`,
            color,
          };

          rows.push({
            id: `${room}-${ref}-${occId}`,
            title: `${firstName} ${lastName}`,
            info: `BookingRef: ${ref}`,
            periods: [period],
            startDate: period.start,
            endDate: period.end,
            color,
          });
        });
      });

      if (rows.length === 0) {
        console.log("[useGridData] No bookings mapped for room", room);
      }

      result[room] = packBookingsIntoRows(rows, beds);
    });

    return result;
  }, [
    knownRooms,
    getBedCount,
    bookingsData,
    guestsDetailsData,
    guestByRoomData,
    activitiesData,
    startDate,
    endDate,
  ]);

  const getReservationDataForRoom = useCallback(
    (room: string) => allRoomData[room] || [],
    [allRoomData]
  );

  const testDates = useMemo(
    () => generateDateRange(startDate, endDate),
    [startDate, endDate]
  );

  return {
    getReservationDataForRoom,
    testDates,
    testStartDate: startDate,
    testEndDate: endDate,
    loading,
    error,
  };
}
