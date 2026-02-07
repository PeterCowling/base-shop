// File: /src/hooks/client/useCheckoutClient.ts
import { useMemo } from "react";

import { type CheckoutRow } from "../../types/component/checkoutrow";
import {
  type ActivitiesByCode,
  type ActivityByCodeData,
} from "../../types/hooks/data/activitiesByCodeData";
import {
  type Activities,
  type Activity,
  type ActivityData,
} from "../../types/hooks/data/activitiesData";
import {
  type FirebaseBookingOccupant,
  type FirebaseBookings,
} from "../../types/hooks/data/bookingsData";
import { type Checkouts } from "../../types/hooks/data/checkoutsData";
import {
  type FinancialsRoom,
  type FinancialsRoomData,
} from "../../types/hooks/data/financialsRoomData";
import type { GuestByRoom } from "../../types/hooks/data/guestByRoomData";
import { type GuestsDetails } from "../../types/hooks/data/guestDetailsData";
import {
  type LoanItem,
  type LoanMethod,
  type Loans,
  type LoanTransaction,
} from "../../types/hooks/data/loansData";
import { parseYMD } from "../../utils/dateUtils";
/**
 * Example occupant booking data shape returned by useBookings():
 *   bookings -> bookingRef -> occupantId -> { checkOutDate, roomNumbers, ... }
 */
export interface OccupantBookingData {
  checkOutDate?: string;
  roomNumbers?: (string | number)[];
}
export type BookingsMap = Record<string, Record<string, OccupantBookingData>>;


function isFirebaseBookingOccupant(
  data: FirebaseBookingOccupant | Record<string, unknown> | undefined
): data is FirebaseBookingOccupant {
  if (!data || typeof data !== "object") {
    return false;
  }
  return (
    "checkInDate" in data ||
    "checkOutDate" in data ||
    "roomNumbers" in data ||
    "leadGuest" in data
  );
}

interface UseCheckoutClientParams {
  bookings: FirebaseBookings | null;
  guestsDetails: GuestsDetails | null;
  financialsRoom: FinancialsRoom | null;
  loans: Loans | null;
  activities: Activities | null;
  activitiesByCodes: ActivitiesByCode | null;
  checkouts: Checkouts;
  guestByRoom: GuestByRoom;
  startDate?: string;
  endDate?: string;
  loading: boolean;
  error: unknown;
}

/**
 * Merges data sources to produce a list of CheckoutRow objects.
 */
function useCheckoutClient({
  bookings,
  guestsDetails,
  financialsRoom,
  loans,
  activities,
  activitiesByCodes,
  checkouts,
  guestByRoom,
  startDate,
  endDate,
  loading,
  error,
}: UseCheckoutClientParams): CheckoutRow[] {
  return useMemo(() => {
    if (loading || error || !bookings) {
      return [];
    }

    const code14Activities: Record<string, Record<string, ActivityByCodeData>> =
      activitiesByCodes?.["14"] ?? {};
    const rows: CheckoutRow[] = [];

    Object.entries(bookings).forEach(([bookingRef, occupantsMap]) => {
      if (!occupantsMap) return;
      Object.entries(occupantsMap).forEach(
        ([occupantId, occupantBookingData]) => {
          if (!isFirebaseBookingOccupant(occupantBookingData)) {
            return;
          }

          const { checkOutDate } = occupantBookingData;
          if (!checkOutDate) return;
          if (startDate && checkOutDate < startDate) return;
          if (endDate && checkOutDate > endDate) return;

          const checkoutRecord =
            checkouts?.[checkOutDate]?.[occupantId] || null;
          const hasCheckoutRecord = Boolean(checkoutRecord);
          const occupantDetailsObj =
            guestsDetails?.[bookingRef]?.[occupantId] || {};
          const bookingFinData = (financialsRoom?.[
            bookingRef
          ] as FinancialsRoomData) || {
            balance: 0,
            totalDue: 0,
            totalPaid: 0,
            totalAdjust: 0,
            transactions: {},
          };
          const rawTxns: Record<string, LoanTransaction> =
            loans?.[bookingRef]?.[occupantId]?.txns ?? {};

          // Build a list of currently active loans by processing both
          // "Loan" and "Refund" transactions. This mirrors the logic used in
          // the check-in screen so that returned items are not shown.
          const activeStacks: Record<
            string,
            { id: string; method: LoanMethod }[]
          > = {};
          Object.entries(rawTxns)
            .sort(([, a], [, b]) => a.createdAt.localeCompare(b.createdAt))
            .forEach(([id, { item, type, count, depositType }]) => {
              activeStacks[item] = activeStacks[item] || [];
              if (type === "Loan") {
                for (let i = 0; i < count; i++) {
                  activeStacks[item].push({ id, method: depositType });
                }
              } else if (type === "Refund") {
                for (let i = 0; i < count; i++) {
                  activeStacks[item].pop();
                }
              }
            });

          const occupantTxns: Record<string, LoanTransaction> = {};
          Object.entries(activeStacks).forEach(([item, stack]) => {
            stack.forEach(({ id, method }) => {
              occupantTxns[id] = {
                count: 1,
                createdAt: "",
                depositType: method,
                deposit: 0,
                item: item as LoanItem,
                type: "Loan",
              };
            });
          });

          // Debug: inspect occupant transactions for loan items
          console.debug(
            `[useCheckoutClient] Txns for ${bookingRef}/${occupantId}:`,
            occupantTxns
          );

          const occupantActs: ActivityData = activities?.[occupantId] || {};
          const rawArray: Activity[] = Object.values(occupantActs);
          const code14Arr: Activity[] = code14Activities[occupantId]
            ? Object.values(code14Activities[occupantId]).map(
                (activity: ActivityByCodeData): Activity => ({
                  code: 14,
                  ...activity,
                })
              )
            : [];
          const mergedActivities: Activity[] = [...rawArray, ...code14Arr];

          let dateOfBirth: string | null = null;
          const dobObj = occupantDetailsObj?.dateOfBirth;
          if (dobObj?.dd && dobObj?.mm && dobObj?.yyyy) {
            dateOfBirth = `${dobObj.yyyy}-${dobObj.mm}-${dobObj.dd}`;
          }

          // Use guestByRoom to get the allocated room number
          const allocatedRoom = guestByRoom?.[occupantId]?.allocated || "";

          rows.push({
            bookingRef,
            occupantId,
            checkOutDate,
            checkOutTimestamp: checkoutRecord?.timestamp
              ? parseYMD(checkoutRecord.timestamp)
              : null,
            firstName: occupantDetailsObj.firstName || "",
            lastName: occupantDetailsObj.lastName || "",
            rooms: [allocatedRoom],
            financials: bookingFinData,
            loans: occupantTxns,
            activities: mergedActivities,
            citizenship: occupantDetailsObj.citizenship || "",
            placeOfBirth: occupantDetailsObj.placeOfBirth || "",
            dateOfBirth,
            municipality: occupantDetailsObj.municipality || "",
            gender: occupantDetailsObj.gender || "F",
            isCompleted: code14Arr.length > 0 || hasCheckoutRecord,
          });
        }
      );
    });

    rows.sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
    return rows;
  }, [
    bookings,
    guestsDetails,
    financialsRoom,
    loans,
    activities,
    activitiesByCodes,
    checkouts,
    guestByRoom,
    startDate,
    endDate,
    loading,
    error,
  ]);
}

export default useCheckoutClient;
