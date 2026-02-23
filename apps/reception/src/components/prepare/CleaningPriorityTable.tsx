// File: src/components/prepare/CleaningPriorityTable.tsx

import { type FC, memo } from "react";

import {
  ReceptionTable,
  ReceptionTableBody,
  ReceptionTableCell,
  ReceptionTableHead,
  ReceptionTableHeader,
  ReceptionTableRow,
} from "@acme/ui/operations";

import { type Cleanliness } from "../../types/hooks/data/roomStatusData";

/**
 * Each table row includes a room number, occupant count,
 * final cleanliness status, and now how many checkouts are needed.
 */
export interface TableRow {
  roomNumber: string;
  occupantCount: number;
  finalCleanliness: Cleanliness; // "Clean" | "Dirty"
  checkouts: number; // newly added: how many occupant checkouts for this date
}

interface CleaningPriorityTableProps {
  data: TableRow[];
  isToday: boolean;
}

/**
 * Simple reusable Chip component for color-coded labels
 * (used in the "Cleanliness" column).
 *
 * How to avoid breaking other code:
 * - We keep the same color-based approach, same usage pattern,
 *   so other references remain unaffected.
 */
interface ChipProps {
  label: string;
  color: "red" | "green";
}
const Chip: FC<ChipProps> = memo(function Chip({ label, color }) {
  const backgroundClass =
    color === "red"
      ? "bg-error-main dark:bg-darkAccentOrange"
      : color === "green"
      ? "bg-success-main dark:bg-darkAccentGreen"
      : "";
  return (
    <span
      className={`${backgroundClass} text-primary-fg dark:text-darkBg px-2 py-1 rounded text-sm`}
    >
      {label}
    </span>
  );
});

/**
 * Displays a simple table of room cleaning priorities with:
 * - Occupant count
 * - Checkouts (the number of occupant checkouts for the relevant date)
 * - Cleanliness chip
 * If `isToday && finalCleanliness === "Dirty"`, shows "(Needs cleaning)" text.
 *
 * How to avoid breaking other code:
 * - Data structure is consistent: we’ve simply added the "checkouts" field
 *   in the same row structure. This preserves backward compatibility
 *   for anything else that might rely on TableRow’s older fields.
 */
const CleaningPriorityTable: FC<CleaningPriorityTableProps> = memo(
  function CleaningPriorityTable({ data, isToday }) {
    return (
      <div className="bg-surface shadow-md rounded p-4 dark:bg-darkBg dark:text-darkAccentGreen">
        <ReceptionTable className="w-full border-collapse dark:bg-darkBg dark:text-darkAccentGreen">
          <ReceptionTableHeader>
            <ReceptionTableRow>
              <ReceptionTableHead className="border-b py-2 text-center">Room</ReceptionTableHead>
              <ReceptionTableHead className="border-b py-2 text-center">Occupants</ReceptionTableHead>
              <ReceptionTableHead className="border-b py-2 text-center">Checkouts</ReceptionTableHead>
              <ReceptionTableHead className="border-b py-2 text-center">Cleanliness</ReceptionTableHead>
            </ReceptionTableRow>
          </ReceptionTableHeader>
          <ReceptionTableBody>
            {data.map((row) => {
              const isDirty = row.finalCleanliness === "Dirty";
              return (
                <ReceptionTableRow key={row.roomNumber}>
                  <ReceptionTableCell className="border-b py-2 text-center">
                    {row.roomNumber}
                  </ReceptionTableCell>
                  <ReceptionTableCell className="border-b py-2 text-center">
                    {row.occupantCount}
                  </ReceptionTableCell>
                  {/* Instead of a red "no" chip, display the actual checkout count */}
                  <ReceptionTableCell className="border-b py-2 text-center">{row.checkouts}</ReceptionTableCell>
                  {/* Cleanliness column: colored chip */}
                  <ReceptionTableCell className="border-b py-2 text-center">
                    <Chip
                      label={row.finalCleanliness}
                      color={isDirty ? "red" : "green"}
                    />
                    {isToday && isDirty && (
                      <span className="ms-2 text-error-main font-semibold">
                        (Needs cleaning)
                      </span>
                    )}
                  </ReceptionTableCell>
                </ReceptionTableRow>
              );
            })}
          </ReceptionTableBody>
        </ReceptionTable>
      </div>
    );
  }
);

export default CleaningPriorityTable;
