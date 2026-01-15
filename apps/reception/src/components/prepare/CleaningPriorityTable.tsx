// File: src/components/prepare/CleaningPriorityTable.tsx

import { FC, memo } from "react";

import { Cleanliness } from "../../types/hooks/data/roomStatusData";

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
      ? "bg-red-500 dark:bg-darkAccentOrange"
      : color === "green"
      ? "bg-green-500 dark:bg-darkAccentGreen"
      : "";
  return (
    <span
      className={`${backgroundClass} text-white dark:text-darkBg px-2 py-1 rounded text-sm`}
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
      <div className="bg-white shadow-md rounded p-4 dark:bg-darkBg dark:text-darkAccentGreen">
        <table className="w-full border-collapse dark:bg-darkBg dark:text-darkAccentGreen">
          <thead>
            <tr>
              <th className="border-b py-2 text-center">Room</th>
              <th className="border-b py-2 text-center">Occupants</th>
              <th className="border-b py-2 text-center">Checkouts</th>
              <th className="border-b py-2 text-center">Cleanliness</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const isDirty = row.finalCleanliness === "Dirty";
              return (
                <tr key={row.roomNumber}>
                  <td className="border-b py-2 text-center">
                    {row.roomNumber}
                  </td>
                  <td className="border-b py-2 text-center">
                    {row.occupantCount}
                  </td>
                  {/* Instead of a red "no" chip, display the actual checkout count */}
                  <td className="border-b py-2 text-center">{row.checkouts}</td>
                  {/* Cleanliness column: colored chip */}
                  <td className="border-b py-2 text-center">
                    <Chip
                      label={row.finalCleanliness}
                      color={isDirty ? "red" : "green"}
                    />
                    {isToday && isDirty && (
                      <span className="ml-2 text-red-500 font-semibold">
                        (Needs cleaning)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);

export default CleaningPriorityTable;
