/* src/hook/mutations/useCCDetailsMutations.ts */
import { useCallback, useState } from "react";
import { ref, set } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import type { CCDetails } from "../../types/hooks/data/ccData";

/**
 * Mutation Hook: Handles saving credit card details to /cc.
 *
 * - saveCCDetails: Overwrites occupant's CC data at cc/<bookingRef>/<occupantId>.
 */
export default function useCCDetailsMutations() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Saves credit card details for a particular occupant's booking.
   */
  const saveCCDetails = useCallback(
    async (bookingRef: string, occupantId: string, details: CCDetails) => {
      try {
        const path = `cc/${bookingRef}/${occupantId}`;
        await set(ref(database, path), details);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  return {
    saveCCDetails,
    error,
  };
}
