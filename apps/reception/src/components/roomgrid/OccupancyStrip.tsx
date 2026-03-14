// File: src/components/roomgrid/OccupancyStrip.tsx
import type { FC } from "react";

import { Inline } from "@acme/design-system/primitives";

import type { GridReservationRow } from "../../hooks/data/roomgrid/useGridData";
import type { MyLocalStatus } from "../../types/MyLocalStatus";

/**
 * Statuses that do NOT count as "occupied tonight".
 *
 * - "free"     — bed/room has no booking
 * - "disabled" — room taken out of service
 * - "16"       — bags picked up / guest fully departed
 *
 * "14" (checkout complete) is intentionally counted as occupied — the guest
 * is still present in the property until they reach status "16".
 */
const NON_OCCUPIED_STATUSES = new Set<MyLocalStatus>(["free", "disabled", "16"]);

/**
 * Returns true if a period's date range includes `today`.
 *
 * Convention: period.start is check-in (inclusive), period.end is check-out
 * (exclusive — the guest's last night is `end - 1 day`).
 */
function periodIncludesToday(start: string, end: string, today: string): boolean {
  return start <= today && today < end;
}

/**
 * Compute the number of rooms that are occupied tonight.
 *
 * A room is considered occupied if it has at least one booking period where:
 *   1. The period's date range overlaps today (start <= today < end).
 *   2. The period's status is not in NON_OCCUPIED_STATUSES.
 *
 * @param rooms                     - Array of room identifiers (from knownRooms)
 * @param getReservationDataForRoom  - Function returning GridReservationRow[] for a given room
 * @param today                     - Today's date as "YYYY-MM-DD"
 */
export function computeOccupancyCount(
  rooms: string[],
  getReservationDataForRoom: (room: string) => GridReservationRow[],
  today: string
): number {
  let count = 0;
  for (const room of rooms) {
    const rows = getReservationDataForRoom(room);
    let roomOccupied = false;
    for (const row of rows) {
      if (roomOccupied) break;
      for (const period of row.periods) {
        if (
          !NON_OCCUPIED_STATUSES.has(period.status) &&
          periodIncludesToday(period.start, period.end, today)
        ) {
          roomOccupied = true;
          break;
        }
      }
    }
    if (roomOccupied) count += 1;
  }
  return count;
}

export interface OccupancyStripProps {
  occupiedCount: number;
  totalRooms: number;
}

/**
 * Compact strip displaying the number of rooms occupied tonight.
 *
 * Renders "Occupied tonight: X / Y rooms" using DS layout primitives.
 * The caller is responsible for computing occupiedCount and totalRooms,
 * and for not rendering this component when data is loading or outside
 * the active date window.
 */
const OccupancyStrip: FC<OccupancyStripProps> = ({ occupiedCount, totalRooms }) => (
  <Inline className="gap-2 px-1 py-1 text-sm text-muted-foreground">
    <span className="font-medium text-foreground">Occupied tonight:</span>
    <span>
      {occupiedCount} / {totalRooms} rooms
    </span>
  </Inline>
);

export default OccupancyStrip;
