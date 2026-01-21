import { useMemo } from "react";

import { useCashCountsData } from "../../hooks/data/useCashCountsData";
import { formatItalyDateFromIso } from "../../utils/dateUtils";

interface UserShiftMap {
  [user: string]: Record<number, number | undefined>;
}

function getVarianceClass(diff: number | undefined): string {
  if (diff === undefined) return "";
  const abs = Math.abs(diff);
  if (abs < 1) return "bg-green-100 dark:bg-darkAccentGreen";
  if (abs < 5) return "bg-yellow-200 dark:bg-darkAccentOrange";
  return "bg-red-300 dark:bg-darkAccentOrange";
}

export default function VarianceHeatMap() {
  const { cashCounts, loading, error } = useCashCountsData();

  const { userMap, shiftLabels } = useMemo(() => {
      const closeRecords = cashCounts.filter((c) => c.type === "close");
      const labels = closeRecords.map((c) =>
        formatItalyDateFromIso(c.timestamp)
      );
    const map: UserShiftMap = {};
    closeRecords.forEach((rec, idx) => {
      if (!map[rec.user]) map[rec.user] = {};
      map[rec.user][idx + 1] = rec.difference;
    });
    return { userMap: map, shiftLabels: labels };
  }, [cashCounts]);

  if (loading) {
    return <p>Loading variance data...</p>;
  }
  if (error) {
    return <p className="text-error-main">Failed to load data.</p>;
  }

  const users = Object.keys(userMap).sort();

  return (
    <div className="overflow-x-auto dark:bg-darkBg dark:text-darkAccentGreen">
      <table className="border-collapse w-full dark:bg-darkSurface dark:text-darkAccentGreen">
        <thead>
          <tr>
            <th className="p-2 border dark:border-darkSurface">Employee</th>
            {shiftLabels.map((label) => (
              <th
                key={label}
                className="p-2 border whitespace-nowrap dark:border-darkSurface"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user} className="text-center">
              <td className="p-2 border text-left font-medium dark:border-darkSurface">
                {user}
              </td>
              {shiftLabels.map((label, idx) => {
                const diff = userMap[user]?.[idx + 1];
                const cellClass = getVarianceClass(diff);
                return (
                  <td
                    key={`${user}-${label}`}
                    className={`p-2 border dark:border-darkSurface ${cellClass}`}
                  >
                    {diff !== undefined ? diff.toFixed(2) : "-"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
