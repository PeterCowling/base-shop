// File: /src/utils/sortCheckouts.ts
import { type Guest } from "../components/checkout/CheckoutTable";

/**
 * Sort check-out data by grouping each bookingRef, sorting occupant rows
 * by numeric room allocated, then ordering incomplete bookings before complete,
 * and sorting equally complete bookings by the minimum allocated room.
 *
 * @param guests Array of guests (check-outs).
 * @returns Sorted array of guests.
 */
export function sortCheckoutsData(guests: Guest[]): Guest[] {
  if (!guests || !guests.length) {
    return [];
  }

  // Group guests by bookingRef
  const grouped: Record<string, Guest[]> = {};
  guests.forEach((guest) => {
    if (!grouped[guest.bookingRef]) {
      grouped[guest.bookingRef] = [];
    }
    grouped[guest.bookingRef].push(guest);
  });

  // For a booking, define "complete" as all guests being isCompleted === true
  // (or you might have some other definition, adapt as needed).
  const isBookingComplete = (rows: Guest[]): boolean => {
    return rows.every((r) => r.isCompleted);
  };

  // Convert roomAllocated string to a number safely
  // Returns 9999 if the string is not numeric
  const parseAllocatedRoomNumber = (roomStr: string): number => {
    const num = parseInt(roomStr.trim(), 10);
    return isNaN(num) ? 9999 : num;
  };

  // Compute the numeric "roomAllocated" for one guest,
  // defaulting to 9999 if there's no valid numeric value
  const occupantRoomNumber = (row: Guest): number => {
    return parseAllocatedRoomNumber(row.roomAllocated);
  };

  // Compute the minimum allocated room for the entire booking
  const getBookingMinAllocatedRoom = (rows: Guest[]): number => {
    const roomNumbers = rows.map(occupantRoomNumber);
    return Math.min(...roomNumbers);
  };

  // Build array of booking objects, each containing occupant rows
  const bookingArray = Object.entries(grouped).map(([bRef, rows]) => {
    // Sort occupant rows within each booking by numeric roomAllocated
    const occupantRows = [...rows].sort(
      (a, b) => occupantRoomNumber(a) - occupantRoomNumber(b)
    );

    const complete = isBookingComplete(occupantRows);
    const bookingMin = getBookingMinAllocatedRoom(occupantRows);

    return {
      bookingRef: bRef,
      occupantRows,
      isComplete: complete,
      bookingMinRoom: bookingMin,
    };
  });

  // Sort the booking groups:
  //  1. Incomplete bookings first (isComplete === false),
  //  2. For same completeness, the booking with the lower
  //     min allocated room number comes first
  bookingArray.sort((a, b) => {
    if (!a.isComplete && b.isComplete) return -1;
    if (a.isComplete && !b.isComplete) return 1;
    return a.bookingMinRoom - b.bookingMinRoom;
  });

  // Flatten each booking’s occupantRows back into a single array
  const sorted = bookingArray.flatMap((book) => book.occupantRows);

  // Debug log the final result (optional)
  console.log("Sorted checkouts data (grouped + numeric):", sorted);

  return sorted;
}
