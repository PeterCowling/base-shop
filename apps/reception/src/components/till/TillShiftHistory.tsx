import { memo } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import { useTillShiftsData } from "../../hooks/data/till/useTillShiftsData";
import { formatEnGbDateTimeFromIso } from "../../utils/dateUtils";

const formatMoney = (value?: number) =>
  typeof value === "number" ? `€${value.toFixed(2)}` : "-";

const formatValue = (value?: string) => value ?? "-";

const TillShiftHistory = memo(function TillShiftHistory() {
  const { shifts, loading, error } = useTillShiftsData({ limitToLast: 10 });

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-600 dark:text-darkAccentGreen">
        Loading recent shifts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-error-main">
        Error loading shifts: {String(error)}
      </div>
    );
  }

  if (shifts.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-600 dark:text-darkAccentGreen">
        No shift history yet.
      </div>
    );
  }

  return (
    <div className="border-t pt-6">
      <h2 className="text-xl font-semibold mb-3">Recent Shifts</h2>
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse text-sm">
          <TableHeader className="bg-gray-100 dark:bg-darkSurface">
            <TableRow>
              <TableHead className="p-2 text-start border-b">Shift ID</TableHead>
              <TableHead className="p-2 text-start border-b">Status</TableHead>
              <TableHead className="p-2 text-start border-b">Opened</TableHead>
              <TableHead className="p-2 text-start border-b">Opened By</TableHead>
              <TableHead className="p-2 text-start border-b">Open Cash</TableHead>
              <TableHead className="p-2 text-start border-b">Closed</TableHead>
              <TableHead className="p-2 text-start border-b">Closed By</TableHead>
              <TableHead className="p-2 text-start border-b">Close Cash</TableHead>
              <TableHead className="p-2 text-start border-b">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift, idx) => (
              <TableRow
                key={shift.id ?? shift.shiftId}
                className={
                  idx % 2 === 0
                    ? "bg-white dark:bg-darkSurface"
                    : "bg-gray-50 dark:bg-darkSurface"
                }
              >
                <TableCell className="p-2 border-b">{shift.shiftId}</TableCell>
                <TableCell className="p-2 border-b">{formatValue(shift.status)}</TableCell>
                <TableCell className="p-2 border-b">
                  {formatEnGbDateTimeFromIso(shift.openedAt)}
                </TableCell>
                <TableCell className="p-2 border-b">{shift.openedBy}</TableCell>
                <TableCell className="p-2 border-b">{formatMoney(shift.openingCash)}</TableCell>
                <TableCell className="p-2 border-b">
                  {shift.closedAt
                    ? formatEnGbDateTimeFromIso(shift.closedAt)
                    : "-"}
                </TableCell>
                <TableCell className="p-2 border-b">{formatValue(shift.closedBy)}</TableCell>
                <TableCell className="p-2 border-b">{formatMoney(shift.closingCash)}</TableCell>
                <TableCell className="p-2 border-b">
                  {typeof shift.closeDifference === "number"
                    ? `${shift.closeDifference >= 0 ? "+" : ""}${formatMoney(
                        shift.closeDifference
                      )}`
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

export default TillShiftHistory;