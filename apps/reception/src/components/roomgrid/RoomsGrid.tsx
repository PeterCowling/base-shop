// File: src/components/roomgrid/RoomsGrid.tsx
import type { ChangeEvent, FC } from "react";
import { memo, useState } from "react";

import { Input } from "@acme/design-system";

import useRoomConfigs from "../../hooks/client/checkin/useRoomConfigs";
import useGridData from "../../hooks/data/roomgrid/useGridData";
import { addDays, formatDateForInput, getYesterday } from "../../utils/dateUtils";

import RoomGrid from "./RoomGrid";

/**
* Essential reservation-grid styles are
 * bundled locally in `reservationGrid.css` to keep the original look and feel
 * without any external package dependency. If you
 * need to tweak colours or spacing, edit that file instead of overriding
 * Tailwind classes elsewhere.
 *
const reservationGridCss = /* css *`
.reservation-grid {
  font-family: var(--font-face, sans-serif);
  font-size: var(--font-size, 14px);
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.reservation-grid__header,
.reservation-grid__cell {
  border: 1px solid var(--color-border, #DDEBF3);
  padding: 0.25rem 0.5rem;
  text-align: center;
}

.reservation-grid__header {
  background: var(--color-background, #FFFFFF);
  font-weight: 600;
}

.reservation-grid__cell--today    { background: var(--color-today,      #E4FFE6); }
.reservation-grid__cell--weekend  { background: var(--color-weekend,    #F8FAFB); }
.reservation-grid__cell--free     { background: var(--date-status-free,        transparent); }
.reservation-grid__cell--disabled { background: var(--date-status-disabled,    #759AB5); }
.reservation-grid__cell--awaiting { background: var(--date-status-awaiting,    #DDEBF3); }
.reservation-grid__cell--confirmed{ background: var(--date-status-confirmed,   #006490); }

.reservation-grid__title,
.reservation-grid__info {
  width: var(--width-title, 50%);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
`;
*/

/**
 * Renders multiple reservation grids (one per room) using the known room configs
 * and test reservation data.
 */
const RoomsGrid: FC = () => {
  const { knownRooms } = useRoomConfigs();
  const [startDate, setStartDate] = useState(() =>
    formatDateForInput(getYesterday())
  );
  const [endDate, setEndDate] = useState(() =>
    formatDateForInput(addDays(getYesterday(), 14))
  );

  const { getReservationDataForRoom, loading, error } = useGridData(
    startDate,
    endDate
  );

  const handleStartChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleEndChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  return (
    <>
      <div className="font-sans p-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-7 w-1 rounded-full bg-primary-main" aria-hidden="true" />
            <h1 className="text-2xl font-heading font-semibold text-foreground">Room Grid</h1>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="start-date">
              From
            </label>
            <Input
              compatibilityMode="no-wrapper"
              id="start-date"
              type="date"
              className="rounded-lg border border-border-2 bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary-main focus:outline-none"
              value={startDate}
              onChange={handleStartChange}
            />
            <label className="text-sm font-medium text-muted-foreground" htmlFor="end-date">
              To
            </label>
            <Input
              compatibilityMode="no-wrapper"
              id="end-date"
              type="date"
              className="rounded-lg border border-border-2 bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary-main focus:outline-none"
              value={endDate}
              onChange={handleEndChange}
            />
          </div>
        </div>
        {loading && (
          <p className="p-4 italic text-muted-foreground">Loading rooms...</p>
        )}

        {!loading && error != null && (
          <p className="p-4 text-error-main">Error: {String(error)}</p>
        )}

        {!loading &&
          error == null &&
          knownRooms.map((roomNumber) => {
            const dataForRoom = getReservationDataForRoom(roomNumber);
            console.log("[RoomsGrid] Rendering room", roomNumber, {
              rows: dataForRoom.length,
            });
            if (dataForRoom.some((row) => row.periods.length === 0)) {
              console.warn("[RoomsGrid] Found row with no periods", {
                roomNumber,
                rows: dataForRoom,
              });
            }
            return (
              <RoomGrid
                key={roomNumber}
                roomNumber={roomNumber}
                data={dataForRoom}
                startDate={startDate}
                endDate={endDate}
              />
            );
          })}
      </div>
    </>
  );
};

export default memo(RoomsGrid);
