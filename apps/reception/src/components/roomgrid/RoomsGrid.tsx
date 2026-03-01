// File: src/components/roomgrid/RoomsGrid.tsx
import type { ChangeEvent, FC } from "react";
import { memo, useState } from "react";

import { Input } from "@acme/design-system";
import { Stack } from "@acme/design-system/primitives";

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
    const newStart = e.target.value;
    const spanDays = Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (24 * 60 * 60 * 1000)
    );
    setStartDate(newStart);
    setEndDate(formatDateForInput(addDays(new Date(newStart), spanDays)));
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="start-date">
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
            </div>
            <span className="text-muted-foreground text-sm select-none">→</span>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="end-date">
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
        </div>
      }
    >
      <Stack gap={5} className="bg-surface rounded-lg shadow-lg p-5">
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
      </Stack>
    </PageShell>
  );
};

export default memo(RoomsGrid);
