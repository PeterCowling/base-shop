/**
 * Shared sort helper utilities used by sortCheckins and sortCheckouts.
 */

/**
 * Convert a roomAllocated string to a number safely.
 * Non-numeric or absent values become 9999 so they sort last.
 */
export function parseAllocatedRoomNumber(roomStr: string | undefined): number {
  if (!roomStr) return 9999;
  const num = parseInt(roomStr.trim(), 10);
  return isNaN(num) ? 9999 : num;
}

/**
 * Compute the minimum allocated room number across an array of rows,
 * each of which has a `roomAllocated` field.
 */
export function getBookingMinAllocatedRoom(
  rows: { roomAllocated?: string }[]
): number {
  const roomNumbers = rows.map((r) => parseAllocatedRoomNumber(r.roomAllocated));
  return Math.min(...roomNumbers);
}
