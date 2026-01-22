/* src/hooks/mutations/useCheckinMutation.ts */

import { useCallback, useState } from "react";
import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type CheckinData } from "../../types/hooks/data/checkinData";

/**
 * Mutation Hook that handles creating or updating occupant check-in data
 * under /checkins/<dateKey> in Firebase.
 */
export function useCheckinMutation() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Updates or creates occupant check-in data at /checkins/<dateKey>/<occupantId>.
   *
   * @param dateKey     The date in YYYY-MM-DD format.
   * @param checkinData Key-value pairs of occupantId -> { reservationCode, timestamp }
   */
  const saveCheckin = useCallback(
    async (
      dateKey: string,
      checkinData: Partial<CheckinData>
    ): Promise<void> => {
      try {
        const checkinRef = ref(database, `checkins/${dateKey}`);
        // `update()` merges data at /checkins/<dateKey> without overwriting the entire node
        await update(checkinRef, checkinData);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  return {
    saveCheckin,
    error,
  };
}
