/* src/hooks/mutations/useSaveBooking.ts */
import { useCallback, useState } from "react";
import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type FirebaseBookingOccupant } from "../../types/hooks/data/bookingsData";

/**
 * Defines the return shape for the useSaveBooking hook.
 */
export interface UseSaveBookingResult {
  saveBooking: (
    bookingRef: string,
    occupantId: string,
    bookingData: Partial<FirebaseBookingOccupant>
  ) => Promise<void>;
  error: unknown;
}

/**
 * A hook to perform mutations on the "bookings" node in Firebase.
 * This hook:
 * - Accepts a bookingRef (the booking code),
 *   occupantId, and the occupant data to update.
 * - Returns a function that can be called to perform the update,
 *   along with any encountered error.
 */
export default function useSaveBooking(): UseSaveBookingResult {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Memoized function to update occupant data under a specific booking reference.
   * Path: /bookings/<bookingRef>/<occupantId>
   */
  const saveBooking = useCallback(
    async (
      bookingRef: string,
      occupantId: string,
      bookingData: Partial<FirebaseBookingOccupant>
    ) => {
      try {
        const bookingRefPath = ref(
          database,
          `bookings/${bookingRef}/${occupantId}`
        );
        await update(bookingRefPath, bookingData);
      } catch (err) {
        setError(err);
        throw err; // Re-throw to allow callers to handle
      }
    },
    [database]
  );

  return { saveBooking, error };
}
