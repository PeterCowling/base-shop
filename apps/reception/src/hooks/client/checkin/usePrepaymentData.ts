/* src/hooks/components/prepayments/usePrepaymentData.ts */

import { useMemo } from "react";
import { Activity } from "../../../types/hooks/data/activitiesData";
import type { OccupantDetails as GuestOccupantDetails } from "../../../types/hooks/data/occupantDetails";
import { RoomTransaction } from "../../../types/hooks/mutations/fiancialsRoomMutation";
import useActivityByCode from "../../data/useActivitiesByCodeData";
import useActivities from "../../data/useActivitiesData";
import useBookings from "../../data/useBookingsData";
import useCCDetails from "../../data/useCCDetails";
import useFinancialsRoom from "../../data/useFinancialsRoom";
import useGuestDetails from "../../data/useGuestDetails";
import { computeHoursElapsed, toEpochMillis } from "../../../utils/dateUtils";

export { computeHoursElapsed } from "../../../utils/dateUtils";

/**
 * ActivityByCodeItem from /activitiesByCode
 * (lacks `code` property; we add it ourselves).
 */
export interface ActivityByCodeItem {
  who: string;
  timestamp: string;
  description: string;
}

/**
 * After we insert the `code` property, we allow extra fields
 * (such as `description`) via an index signature.
 */
export interface ActivityRecord {
  code: number;
  timestamp: string;
  who?: string;
  description?: string;
}

/**
 * The occupant data under a booking.
 */
export interface BookingOccupant {
  leadGuest?: boolean;
  checkInDate?: string;
  checkOutDate?: string;
  roomNumbers?: (string | number)[];
}

export type Bookings = Record<string, Record<string, BookingOccupant>>;

/**
 * guestsDetails shape
 */

export type GuestsDetailsMap = Record<
  string,
  Record<string, GuestOccupantDetails>
>;

/**
 * financialsRoom shape
 */
export interface FinancialsRoom {
  balance: number;
  transactions: Record<string, RoomTransaction>;
  totalDue?: number;
  totalPaid?: number;
  totalAdjust?: number;
}

export type FinancialsRoomMap = Record<string, FinancialsRoom>;

/**
 * ccData shape
 */
export interface CCData {
  ccNum?: string;
  expDate?: string;
}
export type CCDataMap = Record<string, Record<string, CCData>>;

/**
 * The data we build for prepayment checks in this hook.
 */
export interface PrepaymentData {
  occupantId: string;
  bookingRef: string;
  occupantName: string;
  ccCardNumber: string;
  ccExpiry: string;
  codes: number[];
  hoursElapsed21: number | null;
  hoursElapsed5: number | null;
  hoursElapsed6: number | null;
  amountToCharge: number;
  checkInDate: string | null;
}

export interface UsePrepaymentDataResult {
  relevantData: PrepaymentData[];
  loading: boolean;
  error: unknown;
}

/** Find earliest timestamp for a given activity code in an array of ActivityRecords. */
export function findEarliestTimestampForCode(
  activityArr: ActivityRecord[] = [],
  code: number
): string | null {
  let earliest: number | null = null;
  activityArr.forEach((act) => {
    if (act.code === code) {
      const actTime = toEpochMillis(act.timestamp);
      if (earliest === null || actTime < earliest) {
        earliest = actTime;
      }
    }
  });
  return earliest ? new Date(earliest).toISOString() : null;
}

/**
 * Main hook
 */
export default function usePrepaymentData(): UsePrepaymentDataResult {
  // 1. Fetch code-based activities for [21, 5, 6, 7, 8]
  const {
    activitiesByCodes,
    loading: codeLoading,
    error: codeError,
  } = useActivityByCode({ codes: [21, 5, 6, 7, 8] });

  // 2. Fetch the raw Activities
  const {
    activities: rawActivities,
    loading: rawActLoading,
    error: rawActError,
  } = useActivities();

  // 3. Other Data
  const { bookings, loading: bookLoading, error: bookError } = useBookings();
  const {
    guestsDetails,
    loading: occupantDetailsLoading,
    error: occupantDetailsError,
    validationError: _guestValErr,
  } = useGuestDetails();
  const { ccData, loading: ccLoading, error: ccError } = useCCDetails();
  const {
    financialsRoom,
    loading: finLoading,
    error: finError,
  } = useFinancialsRoom();

  /**
   * Merge code-based activities per occupantId into a dictionary:
   * occupantId -> ActivityRecord[]
   */
  const codeActivitiesMap = useMemo<Record<string, ActivityRecord[]>>(() => {
    if (!activitiesByCodes) return {};

    const map: Record<string, ActivityRecord[]> = {};

    Object.entries(activitiesByCodes).forEach(([codeStr, occupantMap]) => {
      const codeNum = parseInt(codeStr, 10);

      Object.entries(occupantMap || {}).forEach(([occupantId, pushObj]) => {
        if (!map[occupantId]) {
          map[occupantId] = [];
        }

        const items = Object.values(pushObj || {}) as ActivityByCodeItem[];
        items.forEach((item) => {
          // We spread 'item' first, then explicitly set 'code' last
          // so 'code' is not duplicated or overwritten:
          const record: ActivityRecord = {
            ...item,
            code: codeNum, // override if needed
          };
          map[occupantId].push(record);
        });
      });
    });

    return map;
  }, [activitiesByCodes]);

  /**
   * Merge raw (non-coded) + code-based activities into a single occupant map
   */
  const allActivitiesMap = useMemo<Record<string, ActivityRecord[]>>(() => {
    const mergedMap: Record<string, ActivityRecord[]> = {};

    if (rawActivities) {
      Object.entries(rawActivities).forEach(([occupantId, acts]) => {
        let arr: ActivityRecord[] = [];

        if (Array.isArray(acts)) {
          // Each item is an Activity
          arr = acts.map((act: Activity) => {
            // Spread 'act' first.
            // This ensures we don't have "code" repeated in the literal:
            return {
              ...act,
            } as ActivityRecord;
          });
        } else {
          const rawArray = Object.values(acts).map((act: Activity) => ({
            ...act,
          })) as ActivityRecord[];
          arr = rawArray;
        }

        mergedMap[occupantId] = [...(mergedMap[occupantId] || []), ...arr];
      });
    }

    // Now merge in the code-based items
    Object.entries(codeActivitiesMap).forEach(([occupantId, codeArr]) => {
      if (!mergedMap[occupantId]) {
        mergedMap[occupantId] = codeArr.slice();
      } else {
        mergedMap[occupantId].push(...codeArr);
      }
    });

    return mergedMap;
  }, [rawActivities, codeActivitiesMap]);

  /**
   * Build a list of PrepaymentData for "leadGuest" bookings with at least
   * one nonRefundable transaction.
   */
  const relevantData: PrepaymentData[] = useMemo(() => {
    if (!bookings || !guestsDetails || !financialsRoom || !allActivitiesMap) {
      return [];
    }

    const results = Object.entries(bookings)
      .map(([bookingRef, occupantMap]) => {
        // Check if there's at least one nonRefundable transaction for this booking
        const { balance = 0, transactions = {} } =
          financialsRoom[bookingRef] || {};
        const hasNonRefundable = Object.values(transactions).some(
          (txn: RoomTransaction) => txn.nonRefundable
        );

        if (!hasNonRefundable) {
          return null;
        }

        // Identify the occupant who is "leadGuest"
        const leadEntry = Object.entries(occupantMap).find(
          ([, occupantData]) => occupantData?.leadGuest === true
        );
        if (!leadEntry) {
          return null;
        }

        const [leadOccupantId] = leadEntry;
        const activityArr = allActivitiesMap[leadOccupantId] || [];

        // Gather distinct codes
        const codes = Array.from(new Set(activityArr.map((a) => a.code)));

        // Timestamps for 21, 5, 6
        const earliest21 = findEarliestTimestampForCode(activityArr, 21);
        const earliest5 = findEarliestTimestampForCode(activityArr, 5);
        const earliest6 = findEarliestTimestampForCode(activityArr, 6);
        const hoursElapsed21 = earliest21
          ? computeHoursElapsed(earliest21)
          : null;
        const hoursElapsed5 = earliest5 ? computeHoursElapsed(earliest5) : null;
        const hoursElapsed6 = earliest6 ? computeHoursElapsed(earliest6) : null;

        // Occupant name
        const detail = guestsDetails[bookingRef]?.[leadOccupantId];
        const occupantName = detail
          ? `${detail.firstName || ""} ${detail.lastName || ""}`.trim()
          : "Unknown Guest";

        // Credit card data
        let cardNumber = "";
        let expiryDate = "";
        if (ccData?.[bookingRef]?.[leadOccupantId]) {
          cardNumber = ccData[bookingRef][leadOccupantId].ccNum || "";
          expiryDate = ccData[bookingRef][leadOccupantId].expDate || "";
        }

        // Check-in date
        const checkInDate = occupantMap[leadOccupantId]?.checkInDate || null;

        return {
          occupantId: leadOccupantId,
          bookingRef,
          occupantName,
          ccCardNumber: cardNumber,
          ccExpiry: expiryDate,
          codes,
          hoursElapsed21,
          hoursElapsed5,
          hoursElapsed6,
          amountToCharge: balance,
          checkInDate,
        } as PrepaymentData;
      })
      .filter((item): item is PrepaymentData => Boolean(item));

    results.forEach((item) => {
      if (item.codes.includes(21)) {
        //console.log(
        //  `[Activity Code 21] BookingRef: ${item.bookingRef}, OccupantId: ${item.occupantId}, OccupantName: ${item.occupantName}`
        //);
      }
    });

    //console.log("[usePrepaymentData] Finalised Prepayment Data:", results);
    return results;
  }, [bookings, guestsDetails, financialsRoom, allActivitiesMap, ccData]);

  const loading =
    codeLoading ||
    rawActLoading ||
    bookLoading ||
    occupantDetailsLoading ||
    ccLoading ||
    finLoading;

  const error =
    codeError ||
    rawActError ||
    bookError ||
    occupantDetailsError ||
    ccError ||
    finError;

  return { relevantData, loading, error };
}
