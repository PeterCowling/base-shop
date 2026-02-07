// src/components/roomgrid/GridCell.tsx
/**
 * GridCell component for the ReservationGrid.
 * Renders a single cell with status color based on period overlap.
 */

import type { ReactElement } from "react";
import { memo, useCallback, useMemo } from "react";

import type { TReservedPeriod } from "./interfaces/reservedPeriod";
import type { TClickCellEventData } from "./ReservationGrid";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface GridCellProps<TCustomStatus extends string = never> {
  rowId: string;
  date: string;
  isWeekend: boolean;
  isToday: boolean;
  periods: TReservedPeriod<TCustomStatus>[];
  statusColors: Record<string, string>;
  onClickCell?: (data: TClickCellEventData<TCustomStatus>) => void;
}

type DayType = "free" | "busy" | "arrival" | "departure";

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Find the period that contains the given date (if any).
 * Period range is [start, end) - start inclusive, end exclusive.
 */
function findPeriodForDate<TCustomStatus extends string>(
  date: string,
  periods: TReservedPeriod<TCustomStatus>[]
): TReservedPeriod<TCustomStatus> | undefined {
  return periods.find((p) => date >= p.start && date < p.end);
}

/**
 * Determine the day type based on date position within period.
 */
function getDayType<TCustomStatus extends string>(
  date: string,
  period: TReservedPeriod<TCustomStatus> | undefined
): DayType {
  if (!period) return "free";

  const isStart = date === period.start;
  if (isStart) return "arrival";

  return "busy";
}

/**
 * Get the background color for the cell based on status.
 */
function getStatusColor(
  status: string | undefined,
  statusColors: Record<string, string>
): string | undefined {
  if (!status) return undefined;
  return statusColors[status];
}

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

function GridCellInner<TCustomStatus extends string = never>({
  rowId,
  date,
  isWeekend,
  isToday,
  periods,
  statusColors,
  onClickCell,
}: GridCellProps<TCustomStatus>): ReactElement {
  // Find the period that contains this date
  const period = useMemo(
    () => findPeriodForDate<TCustomStatus>(date, periods),
    [date, periods]
  );

  // Calculate day type
  const dayType = useMemo(
    () => getDayType<TCustomStatus>(date, period),
    [date, period]
  );

  // Get status and color
  const status = period?.status as string | undefined;
  const backgroundColor = useMemo(
    () => getStatusColor(status, statusColors),
    [status, statusColors]
  );

  // Build class names
  const cellClasses = useMemo(() => {
    const classes = ["rvg-cell"];
    if (isWeekend && !period) classes.push("weekend");
    if (isToday && !period) classes.push("today");
    if (onClickCell) classes.push("rvg-clickable");
    return classes.join(" ");
  }, [isWeekend, isToday, period, onClickCell]);

  // Click handler
  const handleClick = useCallback(() => {
    if (!onClickCell) return;

    onClickCell({
      id: rowId,
      date,
      dayType,
      dayStatus: status ? [status as TCustomStatus] : (["free"] as TCustomStatus[]),
    });
  }, [onClickCell, rowId, date, dayType, status]);

  // Build inline style
  const style = useMemo(() => {
    if (!backgroundColor) return undefined;
    return { backgroundColor };
  }, [backgroundColor]);

  return (
    <td className={cellClasses} style={style} onClick={handleClick}>
      <div className="day" />
    </td>
  );
}

export const GridCell = memo(GridCellInner) as typeof GridCellInner;
