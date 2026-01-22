// src/hook/mutations/useGuestsByBookingMutation.tsx
import { useCallback } from "react";

import { guestsByBookingSchema } from "../../schemas/guestsByBookingSchema";
import { type GuestsByBooking } from "../../types/hooks/data/guestsByBookingData";

/**
 * Mutation hook responsible for updating (create/update/delete) data
 * in the "guestsByBooking" node of the database.
 *
 * Example endpoint usage:
 *   - POST /api/guestsByBooking to create/update occupant reservation
 *   - DELETE /api/guestsByBooking/:occupantId to remove occupant
 */
export function useGuestsByBookingMutation() {
  /**
   * Creates or updates the reservation info for a given occupant.
   * If the occupant does not exist, a new entry will be created.
   */
  const createOrUpdateGuest = useCallback(
    async (
      occupantId: string,
      reservationCode: string
    ): Promise<GuestsByBooking> => {
      const response = await fetch("/api/guestsByBooking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occupantId, reservationCode }),
      });

      if (!response.ok) {
        throw new Error("Failed to create or update guest information.");
      }

      // Return the updated 'guestsByBooking' structure (or partial update)
      const raw = await response.json();
      const updatedData = guestsByBookingSchema.parse(raw);
      return updatedData;
    },
    []
  );

  /**
   * Deletes a guest entry by occupantId.
   */
  const deleteGuest = useCallback(
    async (occupantId: string): Promise<GuestsByBooking> => {
      const response = await fetch(`/api/guestsByBooking/${occupantId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete guest entry.");
      }

      // Return the updated 'guestsByBooking' structure after deletion
      const raw = await response.json();
      const updatedData = guestsByBookingSchema.parse(raw);
      return updatedData;
    },
    []
  );

  /**
   * This hook returns an object containing
   * all mutation methods for "guestsByBooking".
   */
  return {
    createOrUpdateGuest,
    deleteGuest,
  };
}
