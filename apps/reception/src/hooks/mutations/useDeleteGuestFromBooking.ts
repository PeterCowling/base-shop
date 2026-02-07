// File: /src/hooks/mutations/useDeleteGuestFromBooking.ts

import { useCallback, useState } from "react";
import { get, ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";

import useActivitiesMutations from "./useActivitiesMutations";

/**
 * Minimal type for the bookings node at:
 *  "bookings": {
 *    "<bookingRef>": {
 *      "<occupantId>": {... occupant data ... },
 *      ...
 *    }
 *  }
 * We only care that occupant IDs are top-level keys in the booking object.
 */
interface BookingData {
  [occupantId: string]: object;
}

/**
 * Type for the delete function arguments.
 */
interface DeleteArgs {
  bookingRef: string;
  occupantId: string;
}

/**
 * Return type for the useDeleteGuestFromBooking hook.
 */
interface UseDeleteGuestFromBookingReturn {
  deleteGuest: (args: DeleteArgs) => Promise<void>;
  loading: boolean;
  error: unknown;
}

/**
 * useDeleteGuestFromBooking:
 * Mutation hook that removes a single occupant from the specified booking in Firebase.
 *
 * It also:
 *  - Removes occupant references from:
 *    1) bookings
 *    2) checkins
 *    3) checkouts
 *    4) cityTax
 *    5) completedTasks
 *    6) guestByRoom
 *    7) guestsByBooking
 *    8) guestsDetails
 *    9) preorder
 *    10) roomByDate
 *    11) If occupant is the last in the booking, remove the entire booking entry in financialsRoom
 *  - Logs an activity with code 25 to track occupant deletion.
 *
 * Implementation notes to avoid breaking other code:
 *  - Keep occupant references strictly typed.
 *  - Do not remove or modify data beyond occupant-specific keys.
 *  - Use an atomic `update()` for direct occupant references (bookings, cityTax, etc.).
 *  - For date-based references (checkins, checkouts, roomByDate), fetch the entire node, remove occupant if present.
 *  - Then commit all changes in one `update()` call.
 *  - If occupant is the last occupant in a booking, remove the entire financialsRoom/<bookingRef> entry.
 */
export default function useDeleteGuestFromBooking(): UseDeleteGuestFromBookingReturn {
  const database = useFirebaseDatabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  const { addActivity } = useActivitiesMutations();

  /**
   * Removes occupant from all known references, then logs activity code 25.
   */
  const deleteGuest = useCallback(
    async ({ bookingRef, occupantId }: DeleteArgs): Promise<void> => {
      if (!database) {
        setError("Database not initialized.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Snapshot the booking to see if occupant is last occupant.
        const bookingSnapshot = await get(
          ref(database, `bookings/${bookingRef}`)
        );

        let isLastOccupant = false;
        if (bookingSnapshot.exists()) {
          const bookingData = bookingSnapshot.val() as BookingData;
          const occupantKeys = Object.keys(bookingData);
          // If there's exactly 1 occupant and it matches occupantId, occupant is last occupant.
          if (occupantKeys.length === 1 && occupantKeys[0] === occupantId) {
            isLastOccupant = true;
          }
        }

        // Step 1: Prepare an updates object for occupant-specific paths.
        const updates: Record<string, null | string[] | object> = {};

        // Remove occupant from direct references:
        updates[`bookings/${bookingRef}/${occupantId}`] = null;
        updates[`cityTax/${bookingRef}/${occupantId}`] = null;
        updates[`completedTasks/${occupantId}`] = null;
        updates[`guestByRoom/${occupantId}`] = null;
        updates[`guestsByBooking/${occupantId}`] = null;
        updates[`guestsDetails/${bookingRef}/${occupantId}`] = null;
        updates[`preorder/${occupantId}`] = null;

        // Remove bag storage entry if it exists
        updates[`bagStorage/${occupantId}`] = null;

        // Remove all activities under this occupant
        updates[`activities/${occupantId}`] = null;

        // Gather all activity codes that reference this occupant
        const activitiesByCodeSnap = await get(
          ref(database, `activitiesByCode`)
        );
        if (activitiesByCodeSnap.exists()) {
          const actByCodeData = activitiesByCodeSnap.val() as {
            [code: string]: { [occId: string]: Record<string, unknown> };
          };
          for (const [codeKey, occMap] of Object.entries(actByCodeData)) {
            if (occMap && occMap[occupantId]) {
              updates[`activitiesByCode/${codeKey}/${occupantId}`] = null;
            }
          }
        }

        const occupantInfo = (bookingSnapshot.val() as BookingData | null)?.[
          occupantId
        ] as
          | {
              checkInDate?: string;
              checkOutDate?: string;
              roomNumbers?: string[];
            }
          | undefined;

        const checkInDate = occupantInfo?.checkInDate;
        const checkOutDate = occupantInfo?.checkOutDate;
        const roomNumbers = occupantInfo?.roomNumbers || [];

        // Remove occupant's check-in entry directly via the specific date
        if (checkInDate) {
          updates[`checkins/${checkInDate}/${occupantId}`] = null;
        }

        // Remove occupant's check-out entry directly via the specific date
        if (checkOutDate) {
          updates[`checkouts/${checkOutDate}/${occupantId}`] = null;
        }

        // roomByDate -> occupantId may be in guestIds array for each booked room
        if (checkInDate && roomNumbers.length) {
          for (const roomNumber of roomNumbers) {
            const roomIndex = `index_${roomNumber}`;
            const rbdPath = `roomByDate/${checkInDate}/${roomIndex}/${roomNumber}`;
            const snap = await get(ref(database, rbdPath));
            if (snap.exists()) {
              const data = snap.val() as { guestIds?: string[] };
              if (
                Array.isArray(data.guestIds) &&
                data.guestIds.includes(occupantId)
              ) {
                const filteredIds = data.guestIds.filter(
                  (id) => id !== occupantId
                );
                updates[`${rbdPath}/guestIds`] = filteredIds.length
                  ? filteredIds
                  : null;
              }
            }
          }
        }

        // If occupant is last occupant in booking, remove entire financialsRoom/<bookingRef> entry
        if (isLastOccupant) {
          updates[`financialsRoom/${bookingRef}`] = null;
        }

        // Commit all removals in a single update
        await update(ref(database), updates);

        // Finally, log occupant deletion (activity code 25)
        await addActivity(occupantId, 25);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [database, addActivity]
  );

  return {
    deleteGuest,
    loading,
    error,
  };
}
