// File: src/components/roomgrid/RoomsGrid.tsx
import type { ChangeEvent, FC } from "react";
import { memo, useMemo, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Input } from "@acme/design-system";
import { Cluster, Inline, Stack } from "@acme/design-system/primitives";

import useRoomConfigs from "../../hooks/client/checkin/useRoomConfigs";
import useGridData from "../../hooks/data/roomgrid/useGridData";
import { addDays, formatDateForInput, getYesterday } from "../../utils/dateUtils";
import { PageShell } from "../common/PageShell";

import OccupancyStrip, { computeOccupancyCount } from "./OccupancyStrip";
import RoomGrid from "./RoomGrid";
import StatusLegend from "./StatusLegend";
import TodayMovements, { type TodayMovementEntry } from "./TodayMovements";
import UnallocatedPanel from "./UnallocatedPanel";

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

  const { getReservationDataForRoom, unallocatedOccupants, loading, error } = useGridData(
    startDate,
    endDate
  );

  const today = formatDateForInput(new Date());
  const todayInWindow = today >= startDate && today <= endDate;
  const occupiedCount = useMemo(
    () =>
      todayInWindow
        ? computeOccupancyCount(knownRooms, getReservationDataForRoom, today)
        : 0,
    [todayInWindow, knownRooms, getReservationDataForRoom, today]
  );

  const { arrivals, departures } = useMemo<{
    arrivals: TodayMovementEntry[];
    departures: TodayMovementEntry[];
  }>(() => {
    if (!todayInWindow) {
      return { arrivals: [], departures: [] };
    }
    const arrivalList: TodayMovementEntry[] = [];
    const departureList: TodayMovementEntry[] = [];
    const seenArrivals = new Set<string>();
    const seenDepartures = new Set<string>();

    for (const room of knownRooms) {
      const rows = getReservationDataForRoom(room);
      for (const row of rows) {
        for (const period of row.periods) {
          if (period.status === "gap") continue;
          if (period.start === today && !seenArrivals.has(period.occupantId)) {
            seenArrivals.add(period.occupantId);
            arrivalList.push({
              room,
              occupantId: period.occupantId,
              firstName: period.firstName,
              lastName: period.lastName,
            });
          }
          if (period.end === today && !seenDepartures.has(period.occupantId)) {
            seenDepartures.add(period.occupantId);
            departureList.push({
              room,
              occupantId: period.occupantId,
              firstName: period.firstName,
              lastName: period.lastName,
            });
          }
        }
      }
    }
    return { arrivals: arrivalList, departures: departureList };
  }, [todayInWindow, knownRooms, getReservationDataForRoom, today]);

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
        <Cluster justify="between" className="mb-5">
          <Inline gap={3}>
            <div className="h-7 w-1 rounded-full bg-primary-main" aria-hidden="true" />
            <h1 className="text-2xl font-heading font-semibold text-foreground">Room Grid</h1>
          </Inline>
          <Inline gap={2}>
            <Inline className="gap-1.5">
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
            </Inline>
            <span className="text-muted-foreground text-sm select-none">→</span>
            <Inline className="gap-1.5">
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
            </Inline>
          </Inline>
        </Cluster>
      }
    >
      <StatusLegend />

      {!loading && error == null && todayInWindow && (
        <OccupancyStrip occupiedCount={occupiedCount} totalRooms={knownRooms.length} />
      )}

      {!loading && error == null && todayInWindow && (
        <TodayMovements arrivals={arrivals} departures={departures} />
      )}

      <DndProvider backend={HTML5Backend}>
        <Stack gap={5} className="bg-surface rounded-lg shadow-lg p-5">
          {loading && (
            <p className="p-4 italic text-muted-foreground">Loading rooms...</p>
          )}

          {!loading && error != null && (
            <p className="p-4 text-error-main">Error: {String(error)}</p>
          )}

          {!loading && error == null && (
            <>
              {unallocatedOccupants.length > 0 && (
                <UnallocatedPanel occupants={unallocatedOccupants} />
              )}
              {knownRooms.map((roomNumber) => {
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
            </>
          )}
        </Stack>
      </DndProvider>
    </PageShell>
  );
};

export default memo(RoomsGrid);
