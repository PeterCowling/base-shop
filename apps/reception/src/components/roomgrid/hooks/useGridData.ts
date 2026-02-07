// File: /src/libs/reservation-grid/src/lib/hooks/useGridData.ts

import { useCallback, useMemo } from "react";

import { buildDays, buildRows } from "../components/Day/utils/buildData";
import type {
  TGridCell,
  TGridProps,
  TGridRow,
} from "../interfaces/grid.interface";

/**
 * Custom hook that assembles the grid data (days, rows, classes, etc.).
 *
 * This is where you set up the row/cell structure, identify 'weekend' vs 'today',
 * and attach the onClick callback references.
 */
export function useGridData(props: TGridProps) {
  const { data, start, end, onClickCell, highlightToday, locale } = props;

  const days = useMemo(
    () => buildDays(start, end, locale),
    [start, end, locale]
  );

  const rows = useMemo<TGridRow[]>(() => {
    return buildRows(data, days, highlightToday);
  }, [data, days, highlightToday]);

  const handleClick = useCallback(
    (cell: TGridCell) => {
      if (onClickCell) {
        onClickCell({
          id: cell.id,
          date: cell.date,
          dayType: cell.dayType,
          dayStatus: [cell.dayStatus],
        });
      }
    },
    [onClickCell]
  );

  const tableData = useMemo(() => {
    return { days, rows };
  }, [days, rows]);

  return { tableData, handleClick };
}
