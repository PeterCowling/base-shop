// File: src/components/roomgrid/RoomsGrid.tsx
import type { ChangeEvent, FC } from "react";
import { memo, useState } from "react";

import { Input } from "@acme/design-system";

import useRoomConfigs from "../../hooks/client/checkin/useRoomConfigs";
import useGridData from "../../hooks/data/roomgrid/useGridData";
import { addDays, formatDateForInput, getYesterday } from "../../utils/dateUtils";
import { PageShell } from "../common/PageShell";

import RoomGrid from "./RoomGrid";

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
    <PageShell
      title="Room Grid"
      headerSlot={
        <div className="mb-5 flex items-center justify-between">
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
      }
    >
      <div className="bg-surface rounded-xl shadow-lg p-4 space-y-4">
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
    </PageShell>
  );
};

export default memo(RoomsGrid);
