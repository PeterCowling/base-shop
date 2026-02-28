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

import type { FC } from "react";
import { memo, useCallback, useMemo, useState } from "react";

import type { GridReservationRow } from "../../hooks/data/roomgrid/useGridData";
import type { MyLocalStatus } from "../../types/MyLocalStatus";

import BookingDetailsModal from "./BookingDetailsModal";
import { statusColors } from "./constants/statusColors";
import { ReservationGrid, type TClickCellEventData } from "./ReservationGrid";
import styles from "./RoomGrid.module.css";

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
          className={`rounded-lg overflow-hidden border border-border-2 shadow-md ${styles.roomGridWrapper} ${styles.hideInfoColumn}`}
        >
          {/* Panel header */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-surface-3 border-b border-border-2">
            <div className="h-4 w-0.5 rounded-full bg-primary-main" aria-hidden="true" />
            <span className="text-xs font-semibold font-mono tracking-widest uppercase text-foreground">
              Room {roomNumber}
            </span>
          </div>

          {/* Scrollable grid area */}
          <div className="overflow-x-auto bg-surface-2">
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
