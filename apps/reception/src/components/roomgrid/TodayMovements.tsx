// File: src/components/roomgrid/TodayMovements.tsx

import type { FC } from "react";

import { Cluster, Inline, Stack } from "@acme/design-system/primitives";

/**
 * A single movement entry representing an arriving or departing guest.
 */
export interface TodayMovementEntry {
  /** The room number (e.g. "3", "10"). */
  room: string;
  /** The occupant ID — used as a stable React render key. */
  occupantId: string;
  /** Guest first name (may be empty string — renders as "Unknown" when both names absent). */
  firstName: string;
  /** Guest last name (may be empty string). */
  lastName: string;
}

export interface TodayMovementsProps {
  /** Guests whose check-in date equals today (period.start === today). */
  arrivals: TodayMovementEntry[];
  /** Guests whose check-out date equals today (period.end === today). */
  departures: TodayMovementEntry[];
}

/**
 * Format a guest display name, falling back to "Unknown" when both names are absent.
 */
function formatGuestName(firstName: string, lastName: string): string {
  const name = [firstName, lastName].filter(Boolean).join(" ");
  return name || "Unknown";
}

interface MovementListProps {
  label: string;
  entries: TodayMovementEntry[];
  emptyText: string;
}

const MovementList: FC<MovementListProps> = ({ label, entries, emptyText }) => (
  <Stack gap={1}>
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
    {entries.length === 0 ? (
      <span className="text-sm text-muted-foreground italic">{emptyText}</span>
    ) : (
      <Stack gap={1}>
        {entries.map((entry) => (
          <Inline key={entry.occupantId} gap={2} className="text-sm">
            <span className="font-medium text-foreground">Room {entry.room}</span>
            <span className="text-muted-foreground">
              {formatGuestName(entry.firstName, entry.lastName)}
            </span>
          </Inline>
        ))}
      </Stack>
    )}
  </Stack>
);

/**
 * Compact summary of today's guest movements on the rooms-grid page.
 *
 * Renders two sections — "Arriving today" and "Departing today" — derived from the
 * existing grid data. Both lists are passed as pre-computed props from `RoomsGrid`;
 * no hook calls or data fetching occur inside this component.
 *
 * Only rendered when today is within the visible grid window and data has loaded
 * without errors (enforced by the parent guard in `RoomsGrid`).
 *
 * When both lists are empty, renders a single "No movements today" message.
 */
const TodayMovements: FC<TodayMovementsProps> = ({ arrivals, departures }) => {
  if (arrivals.length === 0 && departures.length === 0) {
    return (
      <Inline className="gap-2 px-1 py-1 text-sm text-muted-foreground">
        <span>No movements today</span>
      </Inline>
    );
  }

  return (
    <Cluster gap={6} className="px-1 py-2">
      <MovementList
        label="Arriving today"
        entries={arrivals}
        emptyText="No arrivals today"
      />
      <MovementList
        label="Departing today"
        entries={departures}
        emptyText="No departures today"
      />
    </Cluster>
  );
};

export default TodayMovements;
