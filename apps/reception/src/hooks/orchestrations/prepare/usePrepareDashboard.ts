// File: src/hooks/orchestrations/prepare/usePrepareDashboard.ts

import { useEffect, useMemo } from "react";

import type { Activities } from "../../../types/hooks/data/activitiesData";
import type { RoomsByDate } from "../../../types/hooks/data/roomsByDateData";
import type {
  Cleanliness,
  SingleRoomStatus,
} from "../../../types/hooks/data/roomStatusData";
import {
  getItalyIsoString,
  getLocalToday,
  getLocalYyyyMmDd,
  isToday,
  parseLocalDate,
  subDays,
  toEpochMillis,
} from "../../../utils/dateUtils";
import { useCheckins } from "../../data/useCheckins"; //
import useGuestByRoom from "../../data/useGuestByRoom"; //
import useRoomsByDate from "../../data/useRoomsByDate";
import useRoomStatusData from "../../data/useRoomStatus"; //
import useRoomStatusMutations from "../../mutations/useRoomStatusMutations";

import { useActivitiesData } from "./useActivitiesData";

/**
 * OccupancyItem extends the shape needed by the cleaning table.
 */
export interface OccupancyItem {
  roomNumber: string;
  occupantCount: number;
  wasOccupiedYesterday: boolean;
  localCleanliness: Cleanliness;
  finalCleanliness: Cleanliness;
}

/**
 * Represents a single occupant's check-in record, plus allocated/booked room info.
 */
export interface OccupantCheckinData {
  occupantId: string;
  reservationCode: string;
  timestamp: string;
  allocated: string | null;
  booked: string | null;
}

/**
 * Final merged shape for check-ins after including occupant's allocated/booked info.
 */
export interface CheckinsNodeWithAlloc {
  [date: string]: {
    [occupantId: string]: OccupantCheckinData;
  };
}

/** Raw shape of /checkins (before merging allocated/booked). */
export interface RawCheckinsNode {
  [date: string]: {
    [occupantId: string]: {
      reservationCode: string;
      timestamp: string;
    };
  };
}

/**
 * Determines whether a given occupant is currently "active" (checked in, not checked out)
 * based on their activities. Adjust the code logic as appropriate.
 */
function occupantIsActive(
  occupantId: string,
  activities: Activities | undefined
): boolean {
  if (!activities || !activities[occupantId]) return false;

  const occupantActivities = Object.values(activities[occupantId])
    .filter(
      (act): act is { timestamp: string; code: number; who: string } =>
        !!act.timestamp
    )
    .sort((a, b) => toEpochMillis(a.timestamp) - toEpochMillis(b.timestamp));

  if (occupantActivities.length === 0) return false;

  let finalCode = 0;
  occupantActivities.forEach((act) => {
    finalCode = act.code;
  });

  // Example convention: code=1 => "checked in", code=2 => "checked out"
  return finalCode === 1;
}

/**
 * Returns occupant IDs from roomsByDate for a given date & roomNumber.
 */
function getOccupantIds(
  roomsData: RoomsByDate | null,
  date: string,
  roomNum: string
): string[] {
  if (!roomsData || !roomsData[date]) return [];
  const dateObj = roomsData[date];
  let occupantIds: string[] = [];

  function parseRoomKey(rawKey: string): string {
    return rawKey.startsWith("index_") ? rawKey.slice("index_".length) : rawKey;
  }

  Object.entries(dateObj).forEach(([outerKey, occupantGroup]) => {
    if (parseRoomKey(outerKey) !== roomNum) return;
    if (!occupantGroup || typeof occupantGroup !== "object") return;

    Object.entries(occupantGroup).forEach(([, occupantInfo]) => {
      if (!occupantInfo || typeof occupantInfo !== "object") return;
      const { guestIds } = occupantInfo as { guestIds: string[] };
      if (Array.isArray(guestIds)) {
        occupantIds = occupantIds.concat(guestIds);
      }
    });
  });

  return occupantIds;
}

/**
 * Determines "local cleanliness" simply based on whether any occupant is active.
 */
function computeLocalCleanliness(occupantCount: number): Cleanliness {
  return occupantCount > 0 ? "Dirty" : "Clean";
}

/**
 * usePrepareDashboardData orchestrates all underlying data hooks for the PrepareDashboard.
 *
 * How to avoid breaking other code:
 * - Keep dependency arrays accurate.
 * - Check for empty data or undefined returns and handle them.
 * - Always let loading states settle to false, even when no data is found.
 */
export default function usePrepareDashboardData(selectedDate: string) {
  const localTodayStr = getLocalToday();

  // Compute yesterday's date based on the selected date
  const yesterdayDate = useMemo(() => {
    const parsed = parseLocalDate(selectedDate);
    if (!parsed) return "";
    const yesterday = subDays(parsed, 1);
    return getLocalYyyyMmDd(yesterday);
  }, [selectedDate]);

  // --- Data Hooks ---
  const {
    roomStatusMap,
    loading: statusLoading,
    error: statusError,
  } = useRoomStatusData();

  const {
    roomsByDate,
    loading: roomsLoading,
    error: roomsError,
  } = useRoomsByDate([yesterdayDate, selectedDate]);

  const {
    checkins: allCheckins,
    loading: checkinsLoading,
    error: checkinsError,
  } = useCheckins();

  const {
    guestByRoom,
    loading: guestByRoomLoading,
    error: guestByRoomError,
  } = useGuestByRoom();

  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
  } = useActivitiesData();

  // Combined states for the checkins/guestByRoom/activities trio
  const checkinsCombinedLoading =
    checkinsLoading || guestByRoomLoading || activitiesLoading;
  const checkinsCombinedError =
    checkinsError || guestByRoomError || activitiesError;

  // Beds in each room for summary calculations
  const bedsInRooms: Record<string, number> = useMemo(
    () => ({
      "3": 8,
      "4": 8,
      "5": 6,
      "6": 7,
      "7": 2,
      "8": 2,
      "9": 4,
      "10": 6,
      "11": 6,
      "12": 6,
    }),
    []
  );

  // Filter checkins to just those for the selected date
  const filteredCheckins: RawCheckinsNode | null = useMemo(() => {
    if (!allCheckins || !selectedDate) return null;
    const checkinsForDate = allCheckins[selectedDate];
    if (!checkinsForDate) return null;

    const normalized = Object.entries(checkinsForDate).reduce(
      (acc, [occId, record]) => {
        acc[occId] = {
          ...record,
          reservationCode: record.reservationCode ?? "",
          timestamp: record.timestamp ?? "",
        };
        return acc;
      },
      {} as {
        [occupantId: string]: {
          reservationCode: string;
          timestamp: string;
        };
      }
    );
    return { [selectedDate]: normalized };
  }, [allCheckins, selectedDate]);

  // Merge occupant allocated/booked info
  const mergedCheckins: CheckinsNodeWithAlloc | null = useMemo(() => {
    if (!filteredCheckins || !guestByRoom) return null;
    const output: CheckinsNodeWithAlloc = {};
    Object.entries(filteredCheckins).forEach(([dateKey, occupantMap]) => {
      output[dateKey] = {};
      Object.entries(occupantMap).forEach(([occId, occData]) => {
        const { reservationCode, timestamp, ...rest } = occData;
        const allocInfo = guestByRoom[occId] ?? null;
        output[dateKey][occId] = {
          occupantId: occId,
          reservationCode,
          timestamp,
          allocated: allocInfo?.allocated ?? null,
          booked: allocInfo?.booked ?? null,
          ...rest,
        };
      });
    });
    return output;
  }, [filteredCheckins, guestByRoom]);

  // Determine occupant counts from the data
  const occupancyData: OccupancyItem[] = useMemo(() => {
    if (!roomsByDate || !selectedDate) return [];
    return Object.keys(bedsInRooms).map<OccupancyItem>((roomNum) => {
      const occupantIds = getOccupantIds(roomsByDate, selectedDate, roomNum);
      const activeOccupants = occupantIds.filter((occId) =>
        occupantIsActive(occId, activities)
      );
      const occupantCount = activeOccupants.length;

      const occupantIdsYesterday = getOccupantIds(
        roomsByDate,
        yesterdayDate,
        roomNum
      );
      const wasOccupiedYesterday =
        occupantIdsYesterday.filter((occId) =>
          occupantIsActive(occId, activities)
        ).length > 0;

      const occupantCleanliness = computeLocalCleanliness(occupantCount);

      return {
        roomNumber: roomNum,
        occupantCount,
        wasOccupiedYesterday,
        localCleanliness: occupantCleanliness,
        finalCleanliness: occupantCleanliness,
      };
    });
  }, [roomsByDate, selectedDate, yesterdayDate, bedsInRooms, activities]);

  // Merge occupant-based cleanliness with DB status
  const mergedData: OccupancyItem[] = useMemo(() => {
    if (!roomStatusMap) return occupancyData;

    const localMidnight = parseLocalDate(localTodayStr) ?? new Date(0);
    const todayTime = localMidnight.getTime();

    return occupancyData.map<OccupancyItem>((item) => {
      const dbKey = `index_${item.roomNumber}`;
      const dbStatus: SingleRoomStatus | undefined = roomStatusMap[dbKey];
      if (!dbStatus) return item;

      const { clean, cleaned } = dbStatus;

      if (clean === false) {
        return { ...item, finalCleanliness: "Dirty" };
      }
      if (clean === "Yes") {
        return { ...item, finalCleanliness: "Clean" };
      }
      if (cleaned && cleaned !== "false") {
        const cleanedTime = toEpochMillis(cleaned);
        if (!Number.isNaN(cleanedTime) && cleanedTime >= todayTime) {
          return { ...item, finalCleanliness: "Clean" };
        }
      }

      return item;
    });
  }, [roomStatusMap, occupancyData, localTodayStr]);

  // Summaries
  const totalInRoomsYesterday = useMemo(() => {
    if (!roomsByDate || !yesterdayDate || !roomsByDate[yesterdayDate]) return 0;
    let sum = 0;
    Object.keys(bedsInRooms).forEach((roomNum) => {
      const occupantIds = getOccupantIds(roomsByDate, yesterdayDate, roomNum);
      const activeOccupants = occupantIds.filter((occId) =>
        occupantIsActive(occId, activities)
      );
      sum += activeOccupants.length;
    });
    return sum;
  }, [roomsByDate, yesterdayDate, bedsInRooms, activities]);

  const totalCheckInsToday = useMemo(() => {
    if (!mergedCheckins || !mergedCheckins[selectedDate]) return 0;
    return Object.keys(mergedCheckins[selectedDate]).length;
  }, [mergedCheckins, selectedDate]);

  const totalBeds = useMemo(() => {
    return Object.values(bedsInRooms).reduce((a, b) => a + b, 0);
  }, [bedsInRooms]);

  const occupancyRate = useMemo(() => {
    if (totalBeds === 0) return 0;
    return ((totalInRoomsYesterday + totalCheckInsToday) / totalBeds) * 100;
  }, [totalInRoomsYesterday, totalCheckInsToday, totalBeds]);

  const totalFreeBeds = useMemo(() => {
    return totalBeds - (totalInRoomsYesterday + totalCheckInsToday);
  }, [totalBeds, totalInRoomsYesterday, totalCheckInsToday]);

  // Sync occupant cleanliness to DB if selectedDate is "today"
  const { saveRoomStatus } = useRoomStatusMutations();
  useEffect(() => {
    if (!isToday(selectedDate)) return;
    if (!roomStatusMap) return;

    const localMidnight = parseLocalDate(localTodayStr) ?? new Date(0);
    const todayTime = localMidnight.getTime();

    mergedData.forEach((roomItem) => {
      const dbKey = `index_${roomItem.roomNumber}`;
      const dbStatus = roomStatusMap[dbKey];
      if (!dbStatus) {
        // Create new
        if (roomItem.localCleanliness === "Dirty") {
          saveRoomStatus(dbKey, {
            checkedout: false,
            clean: false,
            cleaned: false,
          })?.catch((err: unknown) => {
            // Even this could be removed if you want zero logs, but kept here for errors
            console.error("[saveRoomStatus] => Error saving dirty:", err);
          });
        } else {
          saveRoomStatus(dbKey, {
            checkedout: false,
            clean: "Yes",
            cleaned: getItalyIsoString(),
          })?.catch((err: unknown) => {
            console.error("[saveRoomStatus] => Error saving clean:", err);
          });
        }
        return;
      }

      const occupantSaysDirty = roomItem.localCleanliness === "Dirty";
      if (dbStatus.clean === false && occupantSaysDirty) {
        return;
      } else if (!occupantSaysDirty) {
        if (!dbStatus.cleaned || dbStatus.cleaned === "false") {
          saveRoomStatus(dbKey, {
            ...dbStatus,
            clean: "Yes",
            cleaned: getItalyIsoString(),
          })?.catch((err: unknown) => {
            console.error("[saveRoomStatus] => Error updating clean:", err);
          });
          return;
        }
        const cleanedTime = toEpochMillis(dbStatus.cleaned);
        if (Number.isNaN(cleanedTime) || cleanedTime < todayTime) {
          saveRoomStatus(dbKey, {
            ...dbStatus,
            clean: "Yes",
            cleaned: getItalyIsoString(),
          })?.catch((err: unknown) => {
            console.error(
              "[saveRoomStatus] => Error updating stale date:",
              err
            );
          });
        }
      } else {
        if (dbStatus.clean === "Yes") {
          saveRoomStatus(dbKey, {
            ...dbStatus,
            clean: false,
          })?.catch((err: unknown) => {
            console.error("[saveRoomStatus] => Error setting dirty:", err);
          });
        }
      }
    });
  }, [selectedDate, localTodayStr, mergedData, roomStatusMap, saveRoomStatus]);

  // Consolidate overall loading/error
  const isLoading = roomsLoading || statusLoading || checkinsCombinedLoading;
  const error = roomsError || statusError || checkinsCombinedError;

  return {
    mergedData,
    totalInRoomsYesterday,
    totalCheckInsToday,
    totalBeds,
    occupancyRate,
    totalFreeBeds,
    isLoading,
    error,
    noRoomsData: !roomsByDate || !roomsByDate[selectedDate],
    noCheckinsData: !mergedCheckins || !mergedCheckins[selectedDate],
  };
}
