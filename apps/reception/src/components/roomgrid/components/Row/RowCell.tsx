import clsx from "../../../../utils/clsx";
import type { Identifier } from "dnd-core";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";

import {
  ItemTypes,
  ReservationDragItem,
  ReservationMovePayload,
} from "../../../../types/dndTypes";
import { dateUtils } from "../../../../utils/dateUtils";
import type { TDaysRange } from "../../interfaces/daysRange.interface";
import type { TDateStatus, TDayType } from "../../interfaces/grid.interface";
import type { TReservedPeriod } from "../../interfaces/reservedPeriod";
import type { TTheme } from "../../interfaces/theme.interface";
import { Day } from "../Day";

interface RowCellProps<TCustomStatus extends string = never> {
  cell: TDaysRange;
  periods: TReservedPeriod<TCustomStatus>[];
  highlightToday?: boolean;
  selected?: boolean;
  selectedColumns?: string[];
  rowId: string | number;
  onClickCell: (
    date: string,
    dayType: TDayType,
    dayStatus: TDateStatus<TCustomStatus>[]
  ) => () => void;
  roomNumber?: number;
  onReservationMove?: (payload: ReservationMovePayload<TCustomStatus>) => void;
  theme: TTheme<TCustomStatus>;
}

const RowCell = <TCustomStatus extends string = never>({
  cell,
  periods,
  highlightToday = false,
  selected = false,
  selectedColumns,
  rowId,
  onClickCell,
  roomNumber,
  onReservationMove,
  theme,
}: RowCellProps<TCustomStatus>) => {
  const cellRef = useRef<HTMLTableCellElement>(null);
  const { isWeekend, value: cellDate, isToday } = cell;

  const isCellToday = highlightToday && isToday;
  const isCellSelected =
    selected ||
    (Array.isArray(selectedColumns) && selectedColumns.includes(cellDate));

  // Booking status for the given date
  const { dayType, dayStatus } = dateUtils.getDayParams(cellDate, periods);
  const isBooked = dayType !== "free" && dayType !== "disabled";

  // Find the enclosing period if the cell is booked
  const currentPeriod = isBooked
    ? (periods.find((p) => cellDate >= p.start && cellDate < p.end) as
        | ReservationDragItem<TCustomStatus>["period"]
        | undefined)
    : undefined;

  /* ------------------------- React‑DND ↓ drop target --------------------- */
  const [{ handlerId, isOver }, drop] = useDrop<
    ReservationDragItem<TCustomStatus>,
    void,
    { handlerId: Identifier | null; isOver: boolean }
  >({
    accept: ItemTypes.RESERVATION,
    collect: (monitor) => ({
      handlerId: monitor.getHandlerId(),
      isOver: monitor.isOver(),
    }),
    canDrop: () => dayType === "free",
    drop: (item, monitor) => {
      if (!monitor.didDrop() && onReservationMove && roomNumber) {
        const payload: ReservationMovePayload<TCustomStatus> = {
          draggedItem: item,
          targetRoomNumber: roomNumber,
          targetRowId: rowId,
          targetDate: cellDate,
        };
        onReservationMove(payload);
      }
    },
  });

  /* -------------------------- React‑DND ↑ drag source -------------------- */
  const [{ isDragging }, drag] = useDrag<
    ReservationDragItem<TCustomStatus>,
    void,
    { isDragging: boolean }
  >({
    type: ItemTypes.RESERVATION,
    item: (): ReservationDragItem<TCustomStatus> => {
      if (!currentPeriod || roomNumber == null) {
        throw new Error("Invalid drag state");
      }
      return {
        type: ItemTypes.RESERVATION,
        period: currentPeriod,
        sourceRoomNumber: roomNumber,
        sourceRowId: rowId,
        sourceStartDate: currentPeriod.start,
        sourceEndDate: currentPeriod.end,
      };
    },
    canDrag: Boolean(currentPeriod && roomNumber),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Combine drag + drop refs
  drag(drop(cellRef));

  // Dynamic class list
  const className = clsx("rvg-cell", {
    weekend: isWeekend,
    today: isCellToday,
    selected: isCellSelected,
    "rvg-clickable": !isDragging,
    dragging: isDragging,
    "drop-over": isOver,
    "can-drop": dayType === "free" && isOver,
    "cannot-drop": dayType !== "free" && isOver,
  });

  const topColor = theme["date.status"][dayStatus[0]];
  const bottomColor = theme["date.status"][dayStatus[1]];

  return (
    <td
      ref={cellRef}
      key={cellDate}
      className={className}
      onClick={
        !isDragging ? onClickCell(cellDate, dayType, dayStatus) : undefined
      }
      data-testid={`cell-${rowId}-${cellDate}`}
      data-handler-id={handlerId ?? ""}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="day">
        <Day type={dayType} topColor={topColor} bottomColor={bottomColor} />
      </div>
    </td>
  );
};

export default RowCell;
