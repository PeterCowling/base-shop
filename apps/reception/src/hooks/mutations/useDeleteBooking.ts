import { get, ref } from "firebase/database";
import { useCallback, useState } from "react";

import useDeleteGuestFromBooking from "./useDeleteGuestFromBooking";
import { useFirebaseDatabase } from "../../services/useFirebase";

interface UseDeleteBookingReturn {
  deleteBooking: (bookingRef: string) => Promise<void>;
  loading: boolean;
  error: unknown;
}

export default function useDeleteBooking(): UseDeleteBookingReturn {
  const database = useFirebaseDatabase();
  const { deleteGuest } = useDeleteGuestFromBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const deleteBooking = useCallback(
    async (bookingRef: string) => {
      if (!database) {
        setError("Database not initialized.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const snapshot = await get(ref(database, `bookings/${bookingRef}`));
        if (snapshot.exists()) {
          const occupants = Object.keys(
            snapshot.val() as Record<string, unknown>
          );
          for (const occupantId of occupants) {
            await deleteGuest({ bookingRef, occupantId });
          }
        }
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [database, deleteGuest]
  );

  return { deleteBooking, loading, error };
}
