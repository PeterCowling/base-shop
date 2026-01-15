// src/lib/components/Row/Row.tsx

import clsx from "../../../../utils/clsx";
import { memo, ReactElement, useCallback } from "react";

import type { TRowProps } from "./Row.interface";
import RowCell from "./RowCell";
import { useMainContext } from "../../context";
import { useTheme } from "../../hooks";
import useDaysRange from "../../hooks/useDaysRange";
import type { TDaysRange } from "../../interfaces/daysRange.interface";
import type { TDateStatus, TDayType } from "../../interfaces/grid.interface";
import type { TTheme } from "../../interfaces/theme.interface";

// Local component import (default export)

/**
 * RowComponent displays a row of cells in a reservation grid.
 */
function RowComponent<TCustomStatus extends string = never>(
  props: TRowProps<TCustomStatus>
): ReactElement {
  const { id: rowId, title, info, periods, selected } = props;

  const {
    start,
    end,
    locale = "en",
    highlightToday,
    showInfo,
    selectedColumns,
    onClickTitle,
    onClickCell,
    // Drag & Drop context
    roomNumber,
    onReservationMove,
  } = useMainContext<TCustomStatus>();

  const numericRoomNumber = roomNumber ? parseInt(roomNumber, 10) : undefined;

  // Theme hook
  const theme: TTheme<TCustomStatus> = useTheme();

  // Date range for the row
  // `locale` from context can be either the locale key or the full locale
  // object. `useDaysRange` expects just the key, so normalise it here.
  const localeKey = typeof locale === "string" ? locale : "en";
  const range: TDaysRange[] = useDaysRange(start, end, localeKey);

  /** Title click handler */
  const onClickTitleLocal = useCallback(() => {
    onClickTitle?.(rowId);
  }, [onClickTitle, rowId]);

  /** Cell click handler */
  const onClickCellLocal = useCallback(
    (
        date: string,
        dayType: TDayType,
        dayStatus: TDateStatus<TCustomStatus>[]
      ) =>
      () => {
        // `onClickCell` expects an object with an `id` field rather than `rowId`
        onClickCell?.({ id: rowId, date, dayType, dayStatus });
      },
    [rowId, onClickCell]
  );

  /**
   * Render a single calendar cell with drag‑and‑drop behaviour.
   * NOTE: `useRef` is *intentionally* inside this callback because each cell
   * needs its own ref for drag‑and‑drop. The rule‑of‑hooks is not violated
   * because `renderCell` itself is executed unconditionally for every item
   * in `range`.
   */
  const renderCell = useCallback(
    (cell: TDaysRange) => (
      <RowCell
        key={cell.value}
        cell={cell}
        periods={periods}
        highlightToday={highlightToday}
        selected={selected}
        selectedColumns={selectedColumns}
        rowId={rowId}
        onClickCell={onClickCellLocal}
        roomNumber={numericRoomNumber}
        onReservationMove={onReservationMove}
        theme={theme}
      />
    ),
    [
      highlightToday,
      selected,
      selectedColumns,
      periods,
      rowId,
      onReservationMove,
      numericRoomNumber,
      theme,
      onClickCellLocal,
    ]
  );

  /* -------------------------------------------------------------------------- */

  const clsTitle = clsx("rvg-title", "rvg-clickable", "rvg-fixed", {
    selected,
  });
  const clsInfo = clsx("rvg-info", { selected });

  return (
    <tr data-testid={`row-${rowId}`}>
      <td
        className={clsTitle}
        onClick={onClickTitleLocal}
        data-testid={`title-${rowId}`}
      >
        {title}
      </td>

      {showInfo && (
        <td className={clsInfo} data-testid={`info-${rowId}`}>
          {info}
        </td>
      )}

      {range.map(renderCell)}
    </tr>
  );
}

export const Row = memo(RowComponent);
