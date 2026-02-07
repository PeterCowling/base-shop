// File: src/hooks/orchestrations/checkin/useCheckinsData.ts

import { useEffect, useMemo, useState } from "react";

import {
  type CheckInRow,
  checkInRowSchema,
} from "../../../types/component/CheckinRow";
import type { OccupantDateOfBirth } from "../../../types/component/dob";
import type { Financials } from "../../../types/domains/booking_old";
import { type Activity } from "../../../types/hooks/data/activitiesData";
import { type FirebaseBookingOccupant } from "../../../types/hooks/data/bookingsData";
import {
  type OccupantLoanData,
} from "../../../types/hooks/data/loansData";
import { getCurrentIsoTimestamp, parseYMD } from "../../../utils/dateUtils";
import {
  parseLoanItem,
  parseLoanMethod,
  parseTxType,
} from "../../../utils/loanParsers";
import useActivitiesByCodeData from "../../data/useActivitiesByCodeData";
import useActivitiesData from "../../data/useActivitiesData";
import useBookings from "../../data/useBookingsData";
import { useCheckins } from "../../data/useCheckins";
import useCityTax from "../../data/useCityTax";
import useFinancialsRoom from "../../data/useFinancialsRoom";
import useGuestByRoom from "../../data/useGuestByRoom";
import useGuestDetails from "../../data/useGuestDetails";
import useLoans from "../../data/useLoans";


/**
 * Safely parse raw occupant loan data from Firebase into an OccupantLoanData shape.
 */
function parseOccupantLoanData(rawData: unknown): OccupantLoanData {
  if (!rawData || typeof rawData !== "object") {
    return { txns: {} };
  }

  const { txns } = rawData as { txns?: Record<string, unknown> };
  if (!txns || typeof txns !== "object") {
    return { txns: {} };
  }

  const occupantLoanData: OccupantLoanData = { txns: {} };

  Object.entries(txns).forEach(([txnId, txnData]) => {
    if (!txnData || typeof txnData !== "object") {
      return;
    }

    const { item, deposit, count, type, createdAt, method } = txnData as {
      item?: string;
      deposit?: number;
      count?: number;
      type?: string;
      createdAt?: string;
      method?: string;
    };

    occupantLoanData.txns[txnId] = {
      item: parseLoanItem(item),
      deposit: typeof deposit === "number" ? deposit : 0,
      count: typeof count === "number" ? count : 1,
      type: parseTxType(type),
      createdAt: createdAt || getCurrentIsoTimestamp(),
      depositType: parseLoanMethod(method),
    };
  });

  return occupantLoanData;
}

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

interface UseCheckinsDataParams {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
}

interface UseCheckinsDataResult {
  data: CheckInRow[];
  loading: boolean;
  /** Non-fatal validation issues encountered when building rows. */
  validationError: unknown;
  error: unknown;
}

/**
 * A custom hook that retrieves and merges check‑in‑related data
 * from multiple Firebase locations, returning a ready‑to‑use array of CheckInRow.
 */
function useCheckinsData({
  startDate,
  endDate,
}: UseCheckinsDataParams): UseCheckinsDataResult {
  // 1) Bookings
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useBookings();

  // 2) Guest details
  const {
    guestsDetails,
    loading: occupantDetailsLoading,
    error: occupantDetailsError,
    validationError: _guestValErr,
  } = useGuestDetails();

  // 3) Financials
  const {
    financialsRoom,
    loading: finLoading,
    error: finError,
  } = useFinancialsRoom();

  // 4) City Tax
  const {
    cityTax,
    loading: cityTaxLoading,
    error: cityTaxError,
  } = useCityTax();

  // 5) Loans
  const { loans, loading: loansLoading, error: loansError } = useLoans();

  // 6) Activities
  const {
    activities,
    loading: actLoading,
    error: actError,
  } = useActivitiesData();

  // 7) /checkins node
  const {
    checkins,
    loading: checkinsLoading,
    error: checkinsError,
  } = useCheckins();

  // 8) /guestByRoom node
  const {
    guestByRoom,
    loading: gbrLoading,
    error: gbrError,
  } = useGuestByRoom();

  // 9) Code‑based activities
  const {
    activitiesByCodes,
    loading: codeBasedLoading,
    error: codeBasedError,
  } = useActivitiesByCodeData({ codes: [21, 5, 6, 7] });

  // Track validation errors encountered during row parsing. These should not
  // block data display, so they are exposed separately from the `error` value.
  const [validationError, setValidationError] = useState<unknown>(null);

  /**
   * Derive a single loading flag across all upstream hooks. If any of the
   * underlying hooks are still loading then the overall hook is considered
   * loading. This value is recomputed on every render so that consumers
   * receive an up‑to‑date boolean without waiting for state updates.
   */
  const loading: boolean =
    bookingsLoading ||
    occupantDetailsLoading ||
    finLoading ||
    cityTaxLoading ||
    loansLoading ||
    actLoading ||
    checkinsLoading ||
    codeBasedLoading ||
    gbrLoading;

  /**
   * Derive a single error across all upstream hooks. Validation errors
   * generated within this hook take precedence if present, otherwise the
   * first truthy upstream error will be returned.
   */
  const error: unknown =
    bookingsError ||
    occupantDetailsError ||
    finError ||
    cityTaxError ||
    loansError ||
    actError ||
    checkinsError ||
    codeBasedError ||
    gbrError;

  /**
   * Merge "code‑based" activities into occupant‑based arrays. We memoize the
   * result for performance since it depends only on activitiesByCodes.
   */
  const codeActivitiesMap = useMemo<Record<string, Activity[]>>(() => {
    const combined: Record<string, Activity[]> = {};
    if (!activitiesByCodes) {
      return combined;
    }

    Object.entries(activitiesByCodes).forEach(([codeStr, occupantMap]) => {
      const codeNum = parseInt(codeStr, 10);
      Object.entries(occupantMap).forEach(([occupantId, pushObj]) => {
        if (!combined[occupantId]) {
          combined[occupantId] = [];
        }
        const recs = Object.values(pushObj).map((item) => ({
          code: codeNum,
          who: item.who,
        }));
        combined[occupantId].push(...recs);
      });
    });
    return combined;
  }, [activitiesByCodes]);

  // Maintain the computed table rows. Updating this state triggers re‑renders
  // but does not affect upstream loading or error flags.
  const [tableData, setTableData] = useState<CheckInRow[]>([]);

  useEffect(() => {
    // If any upstream hook is loading or errored, or we have no bookings yet,
    // clear the current table and bail out. The caller can observe the
    // loading/error flags to determine why the data is empty.
    if (loading || error || !bookings) {
      setTableData((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    // Start with any validation error coming from useGuestDetails.
    let valErr: unknown = _guestValErr ?? null;

    const finalRows: CheckInRow[] = [];
    const startTime = parseYMD(startDate);
    const endTime = parseYMD(endDate);

    // Traverse all bookings and occupants
    Object.entries(bookings).forEach(([bookingRef, occupantsObj]) => {
      if (!occupantsObj) return;
      Object.entries(occupantsObj).forEach(
        ([occupantId, occupantBookingData]) => {
          if (!isFirebaseBookingOccupant(occupantBookingData)) {
            return;
          }
          const { checkInDate, checkOutDate, roomNumbers } =
            occupantBookingData;
          if (!checkInDate || !checkOutDate) return;

          const checkInTime = parseYMD(checkInDate);
          const checkOutTime = parseYMD(checkOutDate);
          // Skip if occupant is outside [startDate..endDate]
          if (checkInTime > endTime || checkOutTime < startTime) {
            return;
          }

          // occupant's check‑in info
          const checkinRecord = checkins?.[checkInDate]?.[occupantId] || null;
          const isoCheckinTimestamp = checkinRecord?.timestamp;

          // occupant's additional details
          const occupantDetailsObj = guestsDetails?.[bookingRef]?.[occupantId];

          // occupant’s city tax record
          const occupantCityTax = cityTax?.[bookingRef]?.[occupantId];

          // occupant's loan record (raw from Firebase)
          const rawLoanData = loans?.[bookingRef]?.[occupantId];
          // parse it into a valid OccupantLoanData structure
          const occupantLoanData = parseOccupantLoanData(rawLoanData);

          // occupant‑based raw activities
          const rawActivitiesObj = activities?.[occupantId];
          const rawActivitiesArr: Activity[] = rawActivitiesObj
            ? Object.values(rawActivitiesObj)
            : [];

          // occupant‑based code activities
          const codedActivities = codeActivitiesMap[occupantId] || [];
          const allActivities = [...rawActivitiesArr, ...codedActivities];

          // occupant's room assignment; provide a default that matches GuestByRoomRecord
          const occupantGuestByRoom = guestByRoom?.[occupantId] || {
            allocated: "",
            booked: "",
          };
          const allocatedRoom = occupantGuestByRoom.allocated;
          const bookedRoom = occupantGuestByRoom.booked;

          // occupant's booking‑level financials
          const bookingFinData = financialsRoom?.[bookingRef];
          let safeFinancials: Financials | undefined;
          if (bookingFinData) {
            safeFinancials = {
              balance: bookingFinData.balance || 0,
              totalDue: bookingFinData.totalDue || 0,
              totalPaid: bookingFinData.totalPaid || 0,
              totalAdjust: bookingFinData.totalAdjust || 0,
              transactions: bookingFinData.transactions || {},
            };
          }

          // occupant's DOB
          let dobObject: OccupantDateOfBirth = { dd: "", mm: "", yyyy: "" };
          if (occupantDetailsObj?.dateOfBirth) {
            const { dd, mm, yyyy } = occupantDetailsObj.dateOfBirth;
            dobObject = {
              dd: dd || "",
              mm: mm || "",
              yyyy: yyyy || "",
            };
          }

          // Build a CheckInRow for each occupant
          const rowCandidate = {
            bookingRef,
            occupantId,
            firstName: occupantDetailsObj?.firstName || "",
            lastName: occupantDetailsObj?.lastName || "",
            roomBooked: bookedRoom,
            roomAllocated: allocatedRoom,
            financials: safeFinancials,
            cityTax: occupantCityTax,
            // Create a record keyed by occupantId:
            loans: {
              [occupantId]: occupantLoanData,
            },
            activity: {},
            isFirstForBooking: false,
            checkInDate,
            checkOutDate,
            rooms: (roomNumbers || []).map(String),
            actualCheckInTimestamp: isoCheckinTimestamp,
            activities: allActivities,
            // Additional occupant fields
            citizenship: occupantDetailsObj?.citizenship || "",
            placeOfBirth: occupantDetailsObj?.placeOfBirth || "",
            dateOfBirth: dobObject,
            municipality: occupantDetailsObj?.municipality || "",
            gender: occupantDetailsObj?.gender || "F",
            docNumber: occupantDetailsObj?.document?.number?.trim() || "",
            mealPlans: undefined,
            notes: undefined,
          };

          const parsed = checkInRowSchema.safeParse(rowCandidate);
          if (parsed.success) {
            finalRows.push(parsed.data);
          } else if (!valErr) {
            valErr = parsed.error;
          }
        }
      );
    });

    // Mark the first occupant row in each booking
    const groupedByBooking: Record<string, CheckInRow[]> = {};
    finalRows.forEach((row) => {
      if (!groupedByBooking[row.bookingRef]) {
        groupedByBooking[row.bookingRef] = [];
      }
      groupedByBooking[row.bookingRef].push(row);
    });
    Object.values(groupedByBooking).forEach((arr) => {
      if (arr.length > 0) {
        arr[0].isFirstForBooking = true;
      }
    });
    setValidationError((prev: unknown) => prev || valErr);
    setTableData(Object.values(groupedByBooking).flat());
  }, [
    bookings,
    guestsDetails,
    financialsRoom,
    cityTax,
    loans,
    activities,
    codeActivitiesMap,
    guestByRoom,
    checkins,
    _guestValErr,
    loading,
    error,
    startDate,
    endDate,
  ]);

  // Memoize the final table data so that callers get a stable reference
  const data = useMemo(() => tableData, [tableData]);

  return { data, loading, validationError, error };
}

// Note: Do NOT wrap a custom hook in React.memo().
// React.memo is for *components* that return JSX.
export default useCheckinsData;
