/* src/hooks/mutations/useGuestDetailsMutation.ts */
import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type OccupantDetails } from "../../types/hooks/data/guestDetailsData";

/**
 * Mutation Hook:
 * Updates occupant data under /guestsDetails in Firebase.
 */
export interface UseGuestDetailsMutationResult {
  saveGuestDetails: (
    bookingRef: string,
    occupantId: string,
    guestData: Partial<OccupantDetails>
  ) => Promise<void>;
}

export default function useGuestDetailsMutation(): UseGuestDetailsMutationResult {
  const database = useFirebaseDatabase();

  /**
   * Save or update occupant details for a specific booking.
   */
  async function saveGuestDetails(
    bookingRef: string,
    occupantId: string,
    guestData: Partial<OccupantDetails>
  ): Promise<void> {
    const occupantRef = ref(
      database,
      `guestsDetails/${bookingRef}/${occupantId}`
    );
    await update(occupantRef, guestData);
  }

  return { saveGuestDetails };
}
