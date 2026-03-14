// File: src/hooks/data/roomgrid/useGridData.ts

import { useCallback, useMemo } from "react";

import { statusColors } from "../../../components/roomgrid/constants/statusColors";
import type { TRow } from "../../../components/roomgrid/interfaces/row";
import type { MyLocalStatus } from "../../../types/MyLocalStatus";
import {
  dateRangesOverlap,
  generateDateRange,
  getNextDay,
  sortByDateAsc,
  toEpochMillis,
} from "../../../utils/dateUtils";
import useRoomConfigs from "../../client/checkin/useRoomConfigs";

import useActivitiesData, { type IActivity } from "./useActivitiesData";
import useBookingsData from "./useBookingsData";
import useGuestByRoomData from "./useGuestByRoomData";
import useGuestsDetailsData from "./useGuestsDetailsData";

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

type BookingDateRange = {
  checkInDate: string;
  checkOutDate: string;
};

/**
 * A booking occupant who has no valid room allocation.
 *
 * "Unallocated" means guestByRoomData[occId]?.allocated is absent, empty string,
 * or a value not in knownRooms. These occupants are invisible on the rooms grid
 * without the UnallocatedPanel.
 */
export interface UnallocatedOccupant {
  bookingRef: string;
  occupantId: string;
  firstName: string;
  lastName: string;
  checkInDate: string;
  checkOutDate: string;
  /**
   * The originally-booked room, used for informational display.
   * Sourced from guestByRoomData[occId]?.booked, falling back to
   * bookingsData[bookingRef][occId]?.roomNumbers[0]. Absent when neither is populated.
   */
  bookedRoom?: string;
  status: MyLocalStatus;
}

function hasBookingDateRange(value: unknown): value is BookingDateRange {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    checkInDate?: unknown;
    checkOutDate?: unknown;
  };

  return (
    typeof candidate.checkInDate === "string" &&
    candidate.checkInDate.length > 0 &&
    typeof candidate.checkOutDate === "string" &&
    candidate.checkOutDate.length > 0
  );
}

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

/**
 * Maximum consecutive free days between two bookings that qualifies as a "short gap".
 * Gaps of 1–GAP_THRESHOLD_DAYS days are highlighted in amber on the rooms grid.
 */
const GAP_THRESHOLD_DAYS = 3;

/**
 * Post-process a packed row array and inject synthetic gap periods for free days
 * that are sandwiched between two bookings within GAP_THRESHOLD_DAYS.
 *
 * A "gap" is a consecutive run of free days where:
 *   - The run length is ≤ GAP_THRESHOLD_DAYS
 *   - There is a booking whose period ends on or before the run's first day
 *   - There is a booking whose period starts on or after the day after the run's last day
 *
 * Each gap day is injected as a synthetic TBookingPeriod with status "gap"
 * (exclusive-end convention: start = gapDate, end = nextDay).
 */
export function detectAndInjectGapPeriods(
  rows: GridReservationRow[],
  startDate: string,
  endDate: string
): GridReservationRow[] {
  const allDates = generateDateRange(startDate, endDate);
  if (allDates.length === 0) return rows;

  return rows.map((row) => {
    const bookingPeriods = row.periods.filter((p) => p.status !== "gap");
    if (bookingPeriods.length < 2) {
      // Need at least 2 bookings to have a gap between them
      return row;
    }

    // Build a set of booked dates for fast lookup
    const bookedDates = new Set<string>();
    for (const period of bookingPeriods) {
      // period.end is exclusive — dates in [period.start, period.end)
      for (const d of generateDateRange(period.start, period.end)) {
        if (d < period.end) {
          bookedDates.add(d);
        }
      }
    }

    // Collect free dates in the grid window
    const freeDates = allDates.filter((d) => !bookedDates.has(d));
    if (freeDates.length === 0) return row;

    // Group consecutive free dates into runs
    const runs: string[][] = [];
    let current: string[] = [freeDates[0]];
    for (let i = 1; i < freeDates.length; i++) {
      const expected = getNextDay(freeDates[i - 1]);
      if (freeDates[i] === expected) {
        current.push(freeDates[i]);
      } else {
        runs.push(current);
        current = [freeDates[i]];
      }
    }
    runs.push(current);

    const gapPeriods: TBookingPeriod[] = [];
    const gapColor = "hsl(40 90% 85%)";

    for (const run of runs) {
      if (run.length > GAP_THRESHOLD_DAYS) continue;

      const runStart = run[0];
      const runEnd = run[run.length - 1]; // last free day (inclusive)
      const dayAfterRun = getNextDay(runEnd);

      // Is there a booking that ends on or before runStart (i.e. ends <= runStart)?
      // A booking's end date is exclusive, so booking.end === runStart means
      // the booking's last occupied night is runStart - 1. We want a booking
      // that directly precedes the gap.
      const hasBookingBefore = bookingPeriods.some(
        (p) => p.end <= runStart
      );

      // Is there a booking that starts on or after dayAfterRun?
      const hasBookingAfter = bookingPeriods.some(
        (p) => p.start >= dayAfterRun
      );

      if (!hasBookingBefore || !hasBookingAfter) continue;

      for (const gapDate of run) {
        gapPeriods.push({
          start: gapDate,
          end: getNextDay(gapDate),
          status: "gap",
          bookingRef: "",
          occupantId: "",
          firstName: "",
          lastName: "",
          info: "Short gap",
          color: gapColor,
        });
      }
    }

    if (gapPeriods.length === 0) return row;

    return {
      ...row,
      periods: [...row.periods, ...gapPeriods],
    };
  });
}

const getActivityStatus = (
  occActs: { [activityId: string]: IActivity } | undefined
): MyLocalStatus => {
  if (!occActs) return "1";
  const list = Object.values(occActs).sort(
    (a, b) => toEpochMillis(b.timestamp) - toEpochMillis(a.timestamp)
  );
  if (!list.length) return "1";
  const precedence: MyLocalStatus[] = ["1", "8", "12", "14", "16", "23"];
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
  return statusColors[status] ?? "hsl(var(--color-info))";
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

      Object.entries(bookingsData).forEach(([ref, occMap]) => {
        Object.entries(occMap as Record<string, unknown>).forEach(([occId, rawData]) => {
          if (occId.startsWith("__")) {
            return;
          }

          if (guestByRoomData[occId]?.allocated !== room) return;

          if (!hasBookingDateRange(rawData)) {
            return;
          }

          const data = rawData;

          if (data.checkOutDate < startDate || data.checkInDate > endDate) {
            return;
          }

          if (data.checkInDate >= data.checkOutDate) {
            console.warn("[useGridData] Invalid booking date range", {
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

      result[room] = detectAndInjectGapPeriods(
        packBookingsIntoRows(rows, beds),
        startDate,
        endDate
      );
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

  /**
   * Collect all occupants who are unallocated within the current date window.
   *
   * An occupant is "unallocated" when:
   *   - guestByRoomData[occId]?.allocated is absent, empty string, or a value
   *     not in knownRooms
   *
   * The result is sorted by checkInDate ascending for deterministic panel order.
   */
  const unallocatedOccupants = useMemo<UnallocatedOccupant[]>(() => {
    const result: UnallocatedOccupant[] = [];

    Object.entries(bookingsData).forEach(([bookingRef, occMap]) => {
      Object.entries(occMap as Record<string, unknown>).forEach(([occId, rawData]) => {
        if (occId.startsWith("__")) return;
        if (!hasBookingDateRange(rawData)) return;

        const data = rawData;

        // Skip bookings outside the selected date window
        if (data.checkOutDate < startDate || data.checkInDate > endDate) return;

        // Skip invalid date ranges
        if (data.checkInDate >= data.checkOutDate) return;

        // Determine if this occupant is unallocated
        const allocated = guestByRoomData[occId]?.allocated;
        const isUnallocated =
          !allocated || !knownRooms.includes(allocated);

        if (!isUnallocated) return;

        const firstName = guestsDetailsData?.[bookingRef]?.[occId]?.firstName ?? "";
        const lastName = guestsDetailsData?.[bookingRef]?.[occId]?.lastName ?? "";
        const status = getActivityStatus(activitiesData[occId]);

        // Prefer guestByRoomData.booked; fall back to bookingsData roomNumbers[0]
        const bookedFromGuestByRoom = guestByRoomData[occId]?.booked;
        const bookedFromBookings =
          (bookingsData[bookingRef] as Record<string, { roomNumbers?: string[] }>)[occId]
            ?.roomNumbers?.[0];
        const bookedRoom = bookedFromGuestByRoom ?? bookedFromBookings;

        result.push({
          bookingRef,
          occupantId: occId,
          firstName,
          lastName,
          checkInDate: data.checkInDate,
          checkOutDate: data.checkOutDate,
          bookedRoom,
          status,
        });
      });
    });

    return sortByDateAsc(result, (o) => o.checkInDate);
  }, [
    knownRooms,
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
    unallocatedOccupants,
    testDates,
    testStartDate: startDate,
    testEndDate: endDate,
    loading,
    error,
  };
}
