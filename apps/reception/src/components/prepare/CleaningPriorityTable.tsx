// File: src/components/prepare/CleaningPriorityTable.tsx

import { type FC, memo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as DSTableRow,
} from "@acme/design-system";

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
      ? "bg-error-main"
      : color === "green"
      ? "bg-success-main"
      : "";
  return (
    <span
      className={`${backgroundClass} text-primary-fg px-2 py-1 rounded text-sm`}
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
      <div className="bg-surface shadow-md rounded p-4">
        <Table className="w-full border-collapse">
          <TableHeader>
            <DSTableRow>
              <TableHead className="border-b py-2 text-center">Room</TableHead>
              <TableHead className="border-b py-2 text-center">Occupants</TableHead>
              <TableHead className="border-b py-2 text-center">Checkouts</TableHead>
              <TableHead className="border-b py-2 text-center">Cleanliness</TableHead>
            </DSTableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const isDirty = row.finalCleanliness === "Dirty";
              return (
                <DSTableRow key={row.roomNumber}>
                  <TableCell className="border-b py-2 text-center">
                    {row.roomNumber}
                  </TableCell>
                  <TableCell className="border-b py-2 text-center">
                    {row.occupantCount}
                  </TableCell>
                  {/* Instead of a red "no" chip, display the actual checkout count */}
                  <TableCell className="border-b py-2 text-center">{row.checkouts}</TableCell>
                  {/* Cleanliness column: colored chip */}
                  <TableCell className="border-b py-2 text-center">
                    <Chip
                      label={row.finalCleanliness}
                      color={isDirty ? "red" : "green"}
                    />
                    {isToday && isDirty && (
                      <span className="ms-2 text-error-main font-semibold">
                        (Needs cleaning)
                      </span>
                    )}
                  </TableCell>
                </DSTableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
);

export default CleaningPriorityTable;
