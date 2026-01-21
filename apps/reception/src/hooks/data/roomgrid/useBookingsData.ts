/** /src/hooks/data/bookings/useBookingsData.ts */
import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * Shape for the /bookings node in Firebase.
 *
 * {
 *   "bookingRef123": {
 *     "occ_12345": {
 *       checkInDate: "2025-03-20",
 *       checkOutDate: "2025-03-26",
 *       leadGuest: true,
 *       roomNumbers: ["6"]
 *     }
 *     ...
 *   }
 *   ...
 * }
 */
export interface IBookingData {
  [bookingRef: string]: {
    [occupantId: string]: {
      checkInDate: string;
      checkOutDate: string;
      leadGuest: boolean;
      roomNumbers: string[];
    };
  };
}

/**
 * Pure Data Hook: Retrieves raw /bookings data from Firebase.
 *
 * How to avoid breaking other code:
 * - We expose the unmodified data structure exactly as stored in /bookings.
 * - Any existing components can rely on this hook to get the underlying raw info
 *   and transform or map it as needed.
 */
export default function useBookingsData() {
  const { data, loading, error } =
    useFirebaseSubscription<IBookingData>("bookings");

  return {
    bookingsData: data ?? {},
    loading,
    error,
  };
}
