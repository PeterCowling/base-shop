import { memo } from "react";

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
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 dark:bg-darkSurface">
            <tr>
              <th className="p-2 text-start border-b">Shift ID</th>
              <th className="p-2 text-start border-b">Status</th>
              <th className="p-2 text-start border-b">Opened</th>
              <th className="p-2 text-start border-b">Opened By</th>
              <th className="p-2 text-start border-b">Open Cash</th>
              <th className="p-2 text-start border-b">Closed</th>
              <th className="p-2 text-start border-b">Closed By</th>
              <th className="p-2 text-start border-b">Close Cash</th>
              <th className="p-2 text-start border-b">Variance</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift, idx) => (
              <tr
                key={shift.id ?? shift.shiftId}
                className={
                  idx % 2 === 0
                    ? "bg-white dark:bg-darkSurface"
                    : "bg-gray-50 dark:bg-darkSurface"
                }
              >
                <td className="p-2 border-b">{shift.shiftId}</td>
                <td className="p-2 border-b">{formatValue(shift.status)}</td>
                <td className="p-2 border-b">
                  {formatEnGbDateTimeFromIso(shift.openedAt)}
                </td>
                <td className="p-2 border-b">{shift.openedBy}</td>
                <td className="p-2 border-b">{formatMoney(shift.openingCash)}</td>
                <td className="p-2 border-b">
                  {shift.closedAt
                    ? formatEnGbDateTimeFromIso(shift.closedAt)
                    : "-"}
                </td>
                <td className="p-2 border-b">{formatValue(shift.closedBy)}</td>
                <td className="p-2 border-b">{formatMoney(shift.closingCash)}</td>
                <td className="p-2 border-b">
                  {typeof shift.closeDifference === "number"
                    ? `${shift.closeDifference >= 0 ? "+" : ""}${formatMoney(
                        shift.closeDifference
                      )}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TillShiftHistory;