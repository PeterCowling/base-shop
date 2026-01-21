/* File: src/hooks/dataOrchestrator/useInHouseGuestsByRoom.tsx */
import { useMemo } from "react";

import useActivitiesByCodeData from "../../data/useActivitiesByCodeData";
import useGuestByRoom from "../../data/useGuestByRoom";
import { parseLocalDate, endOfDayLocal, isOnOrBefore } from "../../../utils/dateUtils";

/** A simple map from roomNumber => occupantIds[] */
export interface CurrentInHouseByRoom {
  [roomNumber: string]: string[];
}

interface UseInHouseGuestsByRoomResult {
  roomsData: CurrentInHouseByRoom;
  loading: boolean;
  error: unknown;
}

/**
 * This hook is date-dependent; we take selectedDateStr (YYYY-MM-DD) from the user.
 * We'll treat that date as "YYYY-MM-DDT23:59:59 local" for our cutoff.
 */
export default function useInHouseGuestsByRoom(
  selectedDateStr: string
): UseInHouseGuestsByRoomResult {
  // 1) Fetch check-in (12) and check-out (14) activities from /activitiesByCode
  const {
    activitiesByCodes,
    loading: activitiesLoading,
    error: activitiesError,
  } = useActivitiesByCodeData({
    codes: [12, 14],
    skip: false,
  });

  // 2) Fetch occupant => { allocated, booked } info from /guestByRoom
  const {
    guestByRoom: guestByRoomData,
    loading: guestByRoomLoading,
    error: guestByRoomError,
  } = useGuestByRoom();

  // 3) Build a local "cutoffDate" at 23:59:59 for the selected day
  const cutoffDate = useMemo(() => {
    const parsed = parseLocalDate(selectedDateStr);
    return parsed ? endOfDayLocal(parsed) : new Date(NaN);
  }, [selectedDateStr]);

  // 4) Merge occupant check-ins/outs with room data
  const roomsData = useMemo<CurrentInHouseByRoom>(() => {
    if (!activitiesByCodes || !guestByRoomData) {
      return {};
    }

    const code12Data = activitiesByCodes["12"] || {};
    const code14Data = activitiesByCodes["14"] || {};

    // occupantIds that are "in house" at selectedDateStr
    const occupantInHouseSet = new Set<string>();

    // Step A: Anyone with a code=12 activity on/before cutoff => candidate for "in"
    Object.entries(code12Data).forEach(([occupantId, occupantActivities]) => {
      const hasCheckinOnOrBefore = Object.values(occupantActivities).some(
        (activity) =>
          activity.timestamp && isOnOrBefore(activity.timestamp, cutoffDate)
      );
      if (hasCheckinOnOrBefore) {
        occupantInHouseSet.add(occupantId);
      }
    });

    // Step B: If occupant has a code=14 on/before cutoff => they are no longer "in"
    Object.entries(code14Data).forEach(([occupantId, occupantActivities]) => {
      const hasCheckoutOnOrBefore = Object.values(occupantActivities).some(
        (activity) =>
          activity.timestamp && isOnOrBefore(activity.timestamp, cutoffDate)
      );
      if (hasCheckoutOnOrBefore) {
        occupantInHouseSet.delete(occupantId);
      }
    });

    // Step C: Build result for rooms 3..12
    const result: CurrentInHouseByRoom = {};
    for (let r = 3; r <= 12; r++) {
      result[String(r)] = [];
    }

    occupantInHouseSet.forEach((occId) => {
      const roomInfo = guestByRoomData[occId];
      if (roomInfo?.allocated) {
        const allocatedRoom = roomInfo.allocated;
        // If the allocated room is between "3" and "12"
        if (allocatedRoom in result) {
          result[allocatedRoom].push(occId);
        }
      }
    });

    return result;
  }, [activitiesByCodes, guestByRoomData, cutoffDate]);

  // 5) Combine loading & error states
  const combinedLoading = activitiesLoading || guestByRoomLoading;
  const combinedError = activitiesError || guestByRoomError;

  return {
    roomsData,
    loading: combinedLoading,
    error: combinedError,
  };
}
