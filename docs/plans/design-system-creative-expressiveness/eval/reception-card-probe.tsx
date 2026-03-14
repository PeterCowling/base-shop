/**
 * Room Status Summary Card — Phase 3 Eval Probe
 *
 * Surface mode: operations (staff-facing dashboard)
 * Theme: reception (hospitality green primary, amber accent)
 * Profile applied: operations mode overrides (flat elevation, dense whitespace, compact padding)
 *
 * This is an eval artifact, not production code.
 */

import React from "react";

// --- Types ---

type RoomStatus = "occupied" | "vacant" | "checkout-today" | "arriving";

interface DataRow {
  label: string;
  value: string;
}

interface RoomStatusCardProps {
  roomNumber: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: RoomStatus;
  dataRows: DataRow[];
  onViewDetails: () => void;
}

// --- Status badge configuration ---

const statusConfig: Record<
  RoomStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  occupied: {
    label: "Occupied",
    bgClass: "bg-primary/12",
    textClass: "text-primary",
  },
  vacant: {
    label: "Vacant",
    bgClass: "bg-muted",
    textClass: "text-muted-fg",
  },
  "checkout-today": {
    label: "Checkout Today",
    bgClass: "bg-accent/12",
    textClass: "text-accent",
  },
  arriving: {
    label: "Arriving",
    bgClass: "bg-primary-soft",
    textClass: "text-primary",
  },
};

// --- Component ---

export function RoomStatusCard({
  roomNumber,
  guestName,
  checkIn,
  checkOut,
  status,
  dataRows,
  onViewDetails,
}: RoomStatusCardProps) {
  const badge = statusConfig[status];

  return (
    // Card container: flat elevation (operations), defined border, md radius, compact padding
    <div className="rounded-md border border-border bg-surface-1 p-3">
      {/* Header row: room number + status badge */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight tracking-wide text-fg">
          {roomNumber}
        </h3>
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tracking-wide ${badge.bgClass} ${badge.textClass}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Guest and dates — compact block */}
      <div className="mt-2 space-y-0.5">
        <p className="text-sm text-fg truncate">{guestName}</p>
        <p className="text-xs text-fg-muted">
          {checkIn}
          <span className="mx-1 text-border-strong" aria-hidden="true">
            /
          </span>
          {checkOut}
        </p>
      </div>

      {/* Data table: striped, no shadow, defined borders */}
      <table className="mt-3 w-full text-xs">
        <tbody>
          {dataRows.map((row, i) => (
            <tr
              key={row.label}
              className={
                i % 2 === 1
                  ? "bg-table-row-alt"
                  : "bg-transparent"
              }
            >
              <td className="py-1 pr-3 text-fg-muted font-medium">
                {row.label}
              </td>
              <td className="py-1 text-right text-fg tabular-nums">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Action button: solid primary, compact */}
      <button
        type="button"
        onClick={onViewDetails}
        className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-fg transition-colors duration-100 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-primary-hover active:bg-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1"
      >
        View Details
      </button>
    </div>
  );
}

// --- Usage example ---

export function RoomStatusCardExample() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <RoomStatusCard
        roomNumber="Room 204"
        guestName="Maria Rossi"
        checkIn="12 Mar"
        checkOut="15 Mar"
        status="occupied"
        dataRows={[
          { label: "Nights remaining", value: "1" },
          { label: "City tax", value: "Paid" },
          { label: "Minibar", value: "\u20AC12.50" },
        ]}
        onViewDetails={() => {}}
      />
      <RoomStatusCard
        roomNumber="Room 107"
        guestName="James Chen"
        checkIn="14 Mar"
        checkOut="14 Mar"
        status="checkout-today"
        dataRows={[
          { label: "Nights remaining", value: "0" },
          { label: "City tax", value: "Pending" },
          { label: "Minibar", value: "\u20AC0.00" },
        ]}
        onViewDetails={() => {}}
      />
      <RoomStatusCard
        roomNumber="Room 301"
        guestName=""
        checkIn="\u2014"
        checkOut="\u2014"
        status="vacant"
        dataRows={[
          { label: "Nights remaining", value: "\u2014" },
          { label: "City tax", value: "\u2014" },
          { label: "Minibar", value: "\u2014" },
        ]}
        onViewDetails={() => {}}
      />
      <RoomStatusCard
        roomNumber="Room 105"
        guestName="Sophie Dupont"
        checkIn="14 Mar"
        checkOut="18 Mar"
        status="arriving"
        dataRows={[
          { label: "Nights remaining", value: "4" },
          { label: "City tax", value: "Not yet" },
          { label: "Minibar", value: "\u20AC0.00" },
        ]}
        onViewDetails={() => {}}
      />
    </div>
  );
}
