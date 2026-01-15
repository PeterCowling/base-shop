// /src/components/roomgrid/RoomGrid.tsx
/**
 * RoomGrid
 * --------
 * Renders a reservation grid for a single room.
 *
 * • Clicking a cell opens a modal with full booking details.
 * • The guest’s first and last name are shown in-cell via the `renderInfo` prop.
 *
 * ⚠️ Do **not** change the expected structure of the grid data.
 * ⚠️ Ensure event callbacks match the data schema.
 */

import { ReservationGrid } from "@daminort/reservation-grid";
import type { FC } from "react";
import { memo, useCallback, useMemo, useState } from "react";

import type { GridReservationRow } from "../../hooks/data/roomgrid/useGridData";
import type { MyLocalStatus } from "../../types/MyLocalStatus";
import BookingDetailsModal from "./BookingDetailsModal";
import { statusColors } from "./constants/statusColors";
import styles from "./RoomGrid.module.css";

/** ----------------------------------------------------------------
 *  Local copy of the `@daminort/reservation-grid` click-event type.
 *  ---------------------------------------------------------------- */
export interface TClickCellEventData<TStatus = string> {
  /** Row identifier (e.g., room ID). */
  id: string;
  /** ISO-8601 date string for the clicked cell. */
  date: string;
  /**
   * Position of the day inside the booking period.
   * The library uses the following literal values:
   *  • 'single'  – a one-day period
   *  • 'start'   – first day of a multi-day period
   *  • 'between' – intermediate day of a multi-day period
   *  • 'end'     – last day of a multi-day period
   *
   * We keep the union open with `string` to remain forward-compatible.
   */
  dayType: "single" | "start" | "between" | "end" | string;
  /** Status or list of statuses assigned to the day. */
  dayStatus: TStatus | TStatus[];
}

export interface BookingDetailsModalData {
  roomNumber: string;
  id: string;
  date: string;
  dayType: string;
  dayStatus: string;
  idSuffix?: string;
  titlePrefix?: string;
  info?: string;
  bookingRef?: string;
  occupantId?: string;
  firstName?: string;
  lastName?: string;
}

interface RoomGridProps {
  /** Array of grid rows with booking periods. */
  data: GridReservationRow[];
  roomNumber: string;
  startDate: string;
  endDate: string;
}

const RoomGrid: FC<RoomGridProps> = memo(
  ({ data, roomNumber, startDate, endDate }) => {
    /* ------------------------------------------------------------------
     * State
     * ---------------------------------------------------------------- */
    const [modalData, setModalData] = useState<BookingDetailsModalData | null>(
      null
    );

    const [lastClick, setLastClick] = useState<number>(0);

    /* ------------------------------------------------------------------
     * Event handlers
     * ---------------------------------------------------------------- */
    const onClickCell = useCallback(
      (eventData: TClickCellEventData<MyLocalStatus>): void => {
        const now = Date.now();
        if (now - lastClick > 400) {
          setLastClick(now);
          return;
        }
        setLastClick(0);
        const { id, date, dayType, dayStatus } = eventData;

        const clickedRow = data.find((row) => row.id === id);
        if (clickedRow) {
          const bookingPeriod = clickedRow.periods.find(
            (period) => period.start <= date && period.end > date
          );

          setModalData({
            roomNumber,
            id,
            date,
            dayType,
            dayStatus: Array.isArray(dayStatus)
              ? dayStatus.join(", ")
              : String(dayStatus),
            ...(bookingPeriod && {
              info: bookingPeriod.info,
              bookingRef: bookingPeriod.bookingRef,
              occupantId: bookingPeriod.occupantId,
              firstName: bookingPeriod.firstName,
              lastName: bookingPeriod.lastName,
            }),
          });
        } else {
          setModalData({
            roomNumber,
            id,
            date,
            dayType,
            dayStatus: Array.isArray(dayStatus)
              ? dayStatus.join(", ")
              : String(dayStatus),
          });
        }
      },
      [data, roomNumber, lastClick]
    );

    const handleCloseModal = useCallback(() => setModalData(null), []);

    /* ------------------------------------------------------------------
     * Theme
     * ---------------------------------------------------------------- */
    const theme = useMemo(
      () => ({
        "date.status": statusColors,
      }),
      []
    );

    /* ------------------------------------------------------------------
     * Render
     * ---------------------------------------------------------------- */
    return (
      <>
        <div
          className={`dark border border-gray-300 rounded-md mb-8 overflow-x-auto p-4 bg-gray-50 shadow-sm dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen ${styles.hideInfoColumn}`}
        >
          <h2 className="text-xl font-semibold mb-2 mt-0 dark:text-darkAccentGreen">Room {roomNumber}</h2>

          <ReservationGrid<MyLocalStatus>
            highlightToday
            locale="en"
            start={startDate}
            end={endDate}
            title="Bed #"
            data={data}
            theme={theme}
            onClickCell={onClickCell}
          />
        </div>

        {modalData && (
          <BookingDetailsModal
            bookingDetails={modalData}
            onClose={handleCloseModal}
          />
        )}
      </>
    );
  }
);

RoomGrid.displayName = "RoomGrid";
export default RoomGrid;
