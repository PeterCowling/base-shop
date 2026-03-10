import { useCallback } from "react";
import { get, ref } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import type { MutationState } from "../../types/hooks/mutations/mutationState";

import useDeleteGuestFromBooking from "./useDeleteGuestFromBooking";
import useMutationState from "./useMutationState";

interface UseDeleteBookingReturn extends MutationState<void> {
  deleteBooking: (bookingRef: string) => Promise<void>;
}

export default function useDeleteBooking(): UseDeleteBookingReturn {
  const database = useFirebaseDatabase();
  const { deleteGuest } = useDeleteGuestFromBooking();
  const { loading, error, run } = useMutationState();

  const deleteBooking = useCallback(
    async (bookingRef: string) => {
      if (!database) {
        throw new Error("Database not initialized.");
      }

      await run(async () => {
        const snapshot = await get(ref(database, `bookings/${bookingRef}`));
        if (snapshot.exists()) {
          const occupants = Object.keys(
            snapshot.val() as Record<string, unknown>
          );
          for (const occupantId of occupants) {
            await deleteGuest({ bookingRef, occupantId });
          }
        }
      });
    },
    [database, deleteGuest, run]
  );

  return { deleteBooking, loading, error };
}
