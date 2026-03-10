// File: /src/hooks/mutations/useArchiveBooking.ts

import { useCallback } from "react";
import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import type { MutationState } from "../../types/hooks/mutations/mutationState";
import { getItalyIsoString } from "../../utils/dateUtils";

import useMutationState from "./useMutationState";

/**
 * Return type for the useArchiveBooking hook.
 */
interface UseArchiveBookingReturn
  extends MutationState<void> {
  archiveBooking: (
    bookingRef: string,
    reason?: string,
    source?: string
  ) => Promise<void>;
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
  const { loading, error, run } = useMutationState();

  /**
   * Archives a booking by writing metadata to /bookingMeta path.
   */
  const archiveBooking = useCallback(
    async (bookingRef: string, reason?: string, source?: string): Promise<void> => {
      if (!database) {
        throw new Error("Database not initialized");
      }

      await run(async () => {
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
      });
    },
    [database, run]
  );

  return {
    archiveBooking,
    loading,
    error,
  };
}
