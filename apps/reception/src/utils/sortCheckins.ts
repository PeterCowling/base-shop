// File: src/utils/sortCheckins.ts
import { type CheckInRow } from "../types/component/CheckinRow";

/**
Sort the check‑in rows so that all occupants belonging to the same booking
 * stay grouped together and bookings are ordered by their overall status.
 * 
 * The booking status is derived from each occupant's activity codes using the
 * same logic as the StatusButton component:
 *   - no relevant codes      -> "pending"
 *   - last state is code 23  -> "bags dropped"
 *   - last state is code 12  -> "check in complete"
 *
 * Bookings are sorted in the order: pending → bags dropped → check in complete.
  * Within each status group the bookings are ordered by their allocated room
 * number so that lower rooms appear first. Guests belonging to the same
 * booking stay grouped together.
 */
export function sortCheckinsData(checkins: CheckInRow[]): CheckInRow[] {
  if (!checkins || checkins.length === 0) return [];

  // ---------------------------------------------------------------------------
  // Group incoming rows by bookingRef so that the array of occupants for each
  // booking can be sorted together and returned contiguously.
  // ---------------------------------------------------------------------------/
  const grouped: Record<string, CheckInRow[]> = {};
  checkins.forEach((row) => {
    if (!grouped[row.bookingRef]) grouped[row.bookingRef] = [];
    grouped[row.bookingRef].push(row);
  });

  // ---------------------------------------------------------------------------
  // Helper functions to determine an occupant's current status based on their
  // activities. We mirror the behaviour of the StatusButton component.
  // ---------------------------------------------------------------------------
  const countToggles = (
    activities: CheckInRow["activities"] | undefined
  ): number => {
    if (!activities || activities.length === 0) return 0;
    return activities.reduce(
      (acc, act) => (act.code === 12 || act.code === 23 ? acc + 1 : acc),
      0
    );
  };

  const statusFromToggles = (toggles: number): 0 | 23 | 12 => {
    const remainder = toggles % 4;
    if (remainder === 2) return 12;
    if (remainder === 1 || remainder === 3) return 23;
    return 0;
  };

  // Convert roomAllocated string to a number safely. Non numeric values become a
  // high number so they sort last.
  const parseAllocatedRoomNumber = (roomStr: string | undefined): number => {
    if (!roomStr) return 9999;
    const num = parseInt(roomStr.trim(), 10);
    return isNaN(num) ? 9999 : num;
  };

  // Compute the minimum allocated room for the entire booking
  const getBookingMinAllocatedRoom = (rows: CheckInRow[]): number => {
    const roomNumbers = rows.map((r) =>
      parseAllocatedRoomNumber(r.roomAllocated)
    );
    return Math.min(...roomNumbers);
  };

  // Determine a numeric booking status weight:
  //   0 => pending, 1 => bags dropped, 2 => check in complete
  const getBookingStatusWeight = (rows: CheckInRow[]): number => {
    let hasBagsDropped = false;
    for (const r of rows) {
      const occupantStatus = statusFromToggles(countToggles(r.activities));
      if (occupantStatus === 12) return 2;
      if (occupantStatus === 23) hasBagsDropped = true;
    }
    return hasBagsDropped ? 1 : 0;
  };

  // ---------------------------------------------------------------------------
  // Build an array describing each booking and its calculated status weight.
  // We deliberately keep the occupant rows in their original order to avoid
  // reordering guests within a booking.
  // ---------------------------------------------------------------------------
  const bookings = Object.entries(grouped).map(([bRef, rows]) => {
    const occupantRows = [...rows].sort(
      (a, b) =>
        parseAllocatedRoomNumber(a.roomAllocated) -
        parseAllocatedRoomNumber(b.roomAllocated)
    );
    return {
      bookingRef: bRef,
      occupantRows,
      statusWeight: getBookingStatusWeight(rows),
      bookingMinRoom: getBookingMinAllocatedRoom(rows),
    };
  });

  // Sort bookings by status first then by minimum allocated room number.
  bookings.sort((a, b) => {
    if (a.statusWeight !== b.statusWeight) {
      return a.statusWeight - b.statusWeight;
    }
    return a.bookingMinRoom - b.bookingMinRoom;
  });

  // Flatten back into a single array of check-in rows with bookings grouped and
  // ordered by status.
  return bookings.flatMap((b) => b.occupantRows);
}
