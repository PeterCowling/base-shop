import { ActivityCode } from "../../constants/activities";
import { type BookingSearchRow } from "../../types/component/bookingSearch";
import { type Activities,type Activity } from "../../types/hooks/data/activitiesData";
import type { FirebaseBookingOccupant, FirebaseBookings } from "../../types/hooks/data/bookingsData";
import { type Checkins } from "../../types/hooks/data/checkinData";
import { type Checkouts } from "../../types/hooks/data/checkoutsData";
import { type FinancialsRoom, type FinancialsRoomData, type RoomTransaction } from "../../types/hooks/data/financialsRoomData";
import { type GuestByRoom } from "../../types/hooks/data/guestByRoomData";
import { type GuestsDetails } from "../../types/hooks/data/guestDetailsData";

/** Priority mapping for determining the highest-priority code in a set of activities. */
const ACTIVITY_PRIORITY: Record<number, number> = {
  [ActivityCode.BOOKING_CREATED]: 1,
  [ActivityCode.FIRST_REMINDER]: 2,
  [ActivityCode.SECOND_REMINDER]: 3,
  [ActivityCode.AUTO_CANCEL_NO_TNC]: 4,
  [ActivityCode.AGREED_NONREFUNDABLE_TNC]: 5,
  [ActivityCode.FAILED_ROOM_PAYMENT_1]: 6,
  [ActivityCode.FAILED_ROOM_PAYMENT_2]: 7,
  [ActivityCode.AUTO_CANCEL_NO_PAYMENT]: 8,
  [ActivityCode.ROOM_PAYMENT_MADE]: 9,
  [ActivityCode.CITY_TAX_PAYMENT]: 10,
  [ActivityCode.KEYCARD_DEPOSIT_MADE]: 11,
  [ActivityCode.DOCUMENT_DETAILS_TAKEN]: 12,
  [ActivityCode.CHECKIN_COMPLETE]: 13,
  [ActivityCode.KEYCARD_REFUND_MADE]: 14,
  [ActivityCode.CHECKOUT_COMPLETE]: 15,
  [ActivityCode.BAG_DROP_TNC]: 16,
  [ActivityCode.BAGS_PICKED_UP]: 17,
  [ActivityCode.SYSTEM_GENERATED_CANCELLATION]: 18,
};

/** Returns the highest-priority code from a list of activities. */
export function getMaxActivityCode(activitiesArray: Activity[]): number {
  let highestPriority = 0;
  let maxCode = 0;

  activitiesArray.forEach((activity) => {
    const code = typeof activity.code === "number" ? activity.code : 0;
    const priority = ACTIVITY_PRIORITY[code] || 0;
    if (priority > highestPriority) {
      highestPriority = priority;
      maxCode = code;
    }
  });

  return maxCode;
}

interface BuildRowsParams {
  bookings: FirebaseBookings | null;
  guestsDetails: GuestsDetails | null;
  financialsRoom: FinancialsRoom | null;
  activities: Activities | null | undefined;
  checkins: Checkins;
  checkouts: Checkouts;
  guestByRoom: GuestByRoom;
  filters: {
    firstName?: string;
    lastName?: string;
    bookingRef?: string;
    status?: string;
    nonRefundable?: string;
    date?: string;
    roomNumber?: string | number;
  };
}

/**
 * Builds booking search rows from various data sources and applies user filters.
 */
export function buildBookingSearchRows({
  bookings,
  guestsDetails,
  financialsRoom,
  activities,
  checkins,
  checkouts,
  guestByRoom,
  filters,
}: BuildRowsParams): BookingSearchRow[] {
  if (!bookings) return [];

  const {
    firstName,
    lastName,
    bookingRef,
    status,
    nonRefundable,
    date,
    roomNumber,
  } = filters;

  const rows: BookingSearchRow[] = [];

  Object.entries(bookings).forEach(([bRef, occupantsMap]) => {
    if (!occupantsMap) return;

    Object.entries(occupantsMap).forEach(([occupantId, occupantBookingData]) => {
      if (occupantId === "__notes") return;

      const occupantData = occupantBookingData as FirebaseBookingOccupant | undefined;
      const roomFromMap = guestByRoom?.[occupantId]?.allocated;
      const mergedRooms = roomFromMap ? [roomFromMap] : occupantData?.roomNumbers ?? [];
      const occupantDetailsObj = guestsDetails?.[bRef]?.[occupantId] || {};

      let dateOfBirth: string | null = null;
      if (occupantDetailsObj.dateOfBirth) {
        const { dd, mm, yyyy } = occupantDetailsObj.dateOfBirth;
        if (dd && mm && yyyy) {
          dateOfBirth = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
        }
      }

      const originalFinData: FinancialsRoomData | undefined = financialsRoom?.[bRef];
      const bookingFinData: FinancialsRoomData = {
        balance: originalFinData?.balance ?? 0,
        totalDue: originalFinData?.totalDue ?? 0,
        totalPaid: originalFinData?.totalPaid ?? 0,
        totalAdjust: originalFinData?.totalAdjust ?? 0,
        transactions: originalFinData?.transactions ?? {},
      };

      const isNonRefundable = Object.values(bookingFinData.transactions)
        .filter((txn: RoomTransaction) => txn.occupantId === occupantId)
        .some((txn: RoomTransaction) => txn.nonRefundable === true);

      const rawOccupantActivities = activities?.[occupantId];
      const mergedActivities: Activity[] = rawOccupantActivities
        ? Object.values(rawOccupantActivities)
        : [];

      rows.push({
        bookingRef: bRef,
        occupantId,
        firstName: occupantDetailsObj.firstName || "",
        lastName: occupantDetailsObj.lastName || "",
        rooms: mergedRooms,
        financials: bookingFinData,
        activities: mergedActivities,
        citizenship: occupantDetailsObj.citizenship || "",
        placeOfBirth: occupantDetailsObj.placeOfBirth || "",
        dateOfBirth,
        municipality: occupantDetailsObj.municipality || "",
        gender: occupantDetailsObj.gender || "F",
        nonRefundable: isNonRefundable,
      });
    });
  });

  const filteredRows = rows.filter((row) => {
    if (firstName && !row.firstName.toLowerCase().includes(firstName.toLowerCase())) return false;

    if (lastName && !row.lastName.toLowerCase().includes(lastName.toLowerCase())) return false;

    if (bookingRef && !row.bookingRef.includes(bookingRef)) return false;

    if (date) {
      const hasCheckin = Boolean(checkins?.[date]?.[row.occupantId]);
      const hasCheckout = Boolean(checkouts?.[date]?.[row.occupantId]);
      if (!hasCheckin && !hasCheckout) return false;
    }

    if (roomNumber) {
      const rn = String(roomNumber);
      if (!row.rooms.map(String).includes(rn)) return false;
    }

    if (status) {
      const maxCode = getMaxActivityCode(row.activities);
      if (maxCode !== Number(status)) return false;
    }

    if (nonRefundable === "true" && !row.nonRefundable) return false;
    if (nonRefundable === "false" && row.nonRefundable) return false;

    return true;
  });

  return filteredRows;
}
