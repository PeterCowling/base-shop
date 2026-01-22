import { type CheckInRow, checkInRowSchema } from "../../../types/component/CheckinRow";
import type { OccupantDateOfBirth } from "../../../types/component/dob";
import type { Financials } from "../../../types/domains/booking_old";
import type { Activity } from "../../../types/hooks/data/activitiesData";
import {
  type FirebaseBookingOccupant,
  type FirebaseBookings,
} from "../../../types/hooks/data/bookingsData";
import type { CityTaxData } from "../../../types/hooks/data/cityTaxData";
import type { GuestByRoomData } from "../../../types/hooks/data/guestByRoomData";
import type { GuestsDetails } from "../../../types/hooks/data/guestDetailsData";
import type { Loans, OccupantLoanData } from "../../../types/hooks/data/loansData";
import { getCurrentIsoTimestamp, parseYMD } from "../../../utils/dateUtils";
import { parseLoanItem, parseLoanMethod, parseTxType } from "../../../utils/loanParsers";

/**
 * Safely parse raw occupant loan data from Firebase into an OccupantLoanData shape.
 */
export function parseOccupantLoanData(rawData: unknown): OccupantLoanData {
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

export interface BuildRowsParams {
  bookings: FirebaseBookings;
  guestsDetails?: GuestsDetails;
  financialsRoom?: Record<string, Financials>;
  cityTax?: CityTaxData;
  loans?: Loans;
  activities?: Record<string, Record<string, Activity>>;
  codeActivitiesMap?: Record<string, Activity[]>;
  guestByRoom?: GuestByRoomData | null;
  checkins?: Record<string, Record<string, { timestamp?: string }>>;
  startDate: string;
  endDate: string;
}

export interface BuildRowsResult {
  rows: CheckInRow[];
  error: unknown;
}

/**
 * Build an array of CheckInRow objects from raw Firebase data.
 */
export function buildCheckinRows({
  bookings,
  guestsDetails,
  financialsRoom,
  cityTax,
  loans,
  activities,
  codeActivitiesMap = {},
  guestByRoom,
  checkins,
  startDate,
  endDate,
}: BuildRowsParams): BuildRowsResult {
  const finalRows: CheckInRow[] = [];
  let validationError: unknown = null;

  guestsDetails = guestsDetails || {};
  financialsRoom = financialsRoom || {};
  cityTax = cityTax || {};
  loans = loans || {};
  activities = activities || {};
  guestByRoom = guestByRoom || {};
  checkins = checkins || {};

  const startTime = parseYMD(startDate);
  const endTime = parseYMD(endDate);

  Object.entries(bookings).forEach(([bookingRef, occupantsObj]) => {
    if (!occupantsObj) return;
    Object.entries(occupantsObj).forEach(([occupantId, occupantBookingData]) => {
      if (!isFirebaseBookingOccupant(occupantBookingData)) {
        return;
      }
      const { checkInDate, checkOutDate, roomNumbers } = occupantBookingData;
      if (!checkInDate || !checkOutDate) return;

      const checkInTime = parseYMD(checkInDate);
      const checkOutTime = parseYMD(checkOutDate);
      if (checkInTime > endTime || checkOutTime < startTime) {
        return;
      }

      const checkinRecord = checkins?.[checkInDate]?.[occupantId] || null;
      const isoCheckinTimestamp = checkinRecord?.timestamp;
      const occupantDetailsObj = guestsDetails?.[bookingRef]?.[occupantId];
      const occupantCityTax = cityTax?.[bookingRef]?.[occupantId];
      const rawLoanData = loans?.[bookingRef]?.[occupantId];
      const occupantLoanData = parseOccupantLoanData(rawLoanData);
      const rawActivitiesObj = activities?.[occupantId];
      const rawActivitiesArr: Activity[] = rawActivitiesObj
        ? Object.values(rawActivitiesObj)
        : [];
      const codedActivities = codeActivitiesMap[occupantId] || [];
      const allActivities = [...rawActivitiesArr, ...codedActivities];
      const occupantGuestByRoom = guestByRoom?.[occupantId] || {
        allocated: "",
        booked: "",
      };
      const allocatedRoom = occupantGuestByRoom.allocated;
      const bookedRoom = occupantGuestByRoom.booked;
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

      let dobObject: OccupantDateOfBirth = { dd: "", mm: "", yyyy: "" };
      if (occupantDetailsObj?.dateOfBirth) {
        const { dd, mm, yyyy } = occupantDetailsObj.dateOfBirth;
        dobObject = {
          dd: dd || "",
          mm: mm || "",
          yyyy: yyyy || "",
        };
      }

      const rowCandidate = {
        bookingRef,
        occupantId,
        firstName: occupantDetailsObj?.firstName || "",
        lastName: occupantDetailsObj?.lastName || "",
        roomBooked: bookedRoom,
        roomAllocated: allocatedRoom,
        financials: safeFinancials,
        cityTax: occupantCityTax,
        loans: { [occupantId]: occupantLoanData },
        activity: {},
        isFirstForBooking: false,
        checkInDate,
        checkOutDate,
        rooms: (roomNumbers || []).map(String),
        actualCheckInTimestamp: isoCheckinTimestamp,
        activities: allActivities,
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
      } else {
        validationError = parsed.error;
      }
    });
  });

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

  return { rows: Object.values(groupedByBooking).flat(), error: validationError };
}
