// File: /src/hooks/mutations/useArchiveBooking.ts

import { useCallback, useState } from "react";
import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { getItalyIsoString } from "../../utils/dateUtils";

/**
 * Return type for the useArchiveBooking hook.
 */
interface UseArchiveBookingReturn {
  archiveBooking: (
    bookingRef: string,
    reason?: string,
    source?: string
  ) => Promise<void>;
  loading: boolean;
  error: unknown;
}

/**
 * useArchiveBooking:
 * Mutation hook that marks a booking as cancelled without deleting occupant data.
 *
 * Implementation:
 *  - Writes to /bookingMeta/{reservationCode}/status = "cancelled"
 *  - Writes to /bookingMeta/{reservationCode}/cancelledAt = ISO timestamp
 *  - Writes to /bookingMeta/{reservationCode}/cancellationSource = source (defaults to "staff")
 *  - Does NOT delete occupant data from /bookings/{reservationCode}/{occupantId}
 *  - Does NOT delete activities from /activities/{occupantId}/*
 *
 * This is a "soft delete" approach that preserves audit trail while marking booking
 * as cancelled in the system.
 */
export default function useArchiveBooking(): UseArchiveBookingReturn {
  const database = useFirebaseDatabase();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<unknown>(null);

  /**
   * Archives a booking by writing metadata to /bookingMeta path.
   */
  const archiveBooking = useCallback(
    async (bookingRef: string, reason?: string, source?: string): Promise<void> => {
      if (!database) {
        const err = new Error("Database not initialized");
        setError(err);
        throw err;
      }

      setLoading(true);
      setError(null);

      try {
        const timestamp = getItalyIsoString();
        const cancellationSource = source ?? "staff";

        // Prepare updates for /bookingMeta path
        const updates: Record<string, string> = {
          [`bookingMeta/${bookingRef}/status`]: "cancelled",
          [`bookingMeta/${bookingRef}/cancelledAt`]: timestamp,
          [`bookingMeta/${bookingRef}/cancellationSource`]: cancellationSource,
        };

        // Optionally include reason if provided
        if (reason) {
          updates[`bookingMeta/${bookingRef}/cancellationReason`] = reason;
        }

        // Commit all writes in a single atomic update
        await update(ref(database), updates);
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [database]
  );

  return {
    archiveBooking,
    loading,
    error,
  };
}
