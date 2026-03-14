// File: src/components/roomgrid/UnallocatedPanel.tsx
import type { FC } from "react";

import { Cluster, Inline, Stack } from "@acme/design-system/primitives";

import type { UnallocatedOccupant } from "../../hooks/data/roomgrid/useGridData";

import { statusColors } from "./constants/statusColors";

interface UnallocatedPanelProps {
  occupants: UnallocatedOccupant[];
}

/**
 * Read-only panel showing all booking occupants who have not been assigned a
 * room within the selected date window.
 *
 * Rendered above the per-room panels in RoomsGrid. Hidden entirely when
 * `occupants` is empty — the caller guards with `occupants.length > 0`.
 *
 * v1 is read-only. A future allocation action would require a new
 * occupant-scoped modal (BookingDetailsModal is unsafe — it reassigns all
 * occupants under the booking ref, not just the selected one).
 */
const UnallocatedPanel: FC<UnallocatedPanelProps> = ({ occupants }) => {
  return (
    <Stack
      gap={3}
      className="rounded-lg border border-border-2 bg-surface p-4"
      data-cy="unallocated-panel"
    >
      {/* Panel header */}
      <Cluster justify="between" className="border-b border-border-2 pb-3">
        <Inline gap={2}>
          <span
            className="inline-block h-3 w-3 rounded-sm border border-border-2 shrink-0 bg-error-main"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Unallocated Bookings
          </h2>
        </Inline>
        <span className="rounded-full bg-error-main px-2 py-0.5 text-xs font-semibold text-danger-fg tabular-nums">
          {occupants.length}
        </span>
      </Cluster>

      {/* Occupant rows */}
      <Stack gap={1}>
        {occupants.map((occupant) => (
          <Inline
            key={`${occupant.bookingRef}-${occupant.occupantId}`}
            gap={4}
            className="rounded-lg px-1 py-1.5 hover:bg-muted/40 flex-nowrap"
            data-cy="unallocated-row"
          >
            {/* Status badge + name */}
            <Inline gap={2} className="min-w-0 flex-1">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm border border-border-2"
                style={{ backgroundColor: statusColors[occupant.status] }}
                aria-hidden="true"
              />
              <span className="text-sm text-foreground truncate">
                {occupant.firstName || occupant.lastName
                  ? `${occupant.firstName} ${occupant.lastName}`.trim()
                  : "Unknown"}
              </span>
            </Inline>

            <span className="text-sm text-muted-foreground font-mono shrink-0">
              {occupant.bookingRef}
            </span>

            <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
              {occupant.checkInDate}
            </span>

            <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
              {occupant.checkOutDate}
            </span>

            <span className="text-sm text-muted-foreground shrink-0">
              {occupant.bookedRoom ?? "—"}
            </span>
          </Inline>
        ))}
      </Stack>
    </Stack>
  );
};

export default UnallocatedPanel;
