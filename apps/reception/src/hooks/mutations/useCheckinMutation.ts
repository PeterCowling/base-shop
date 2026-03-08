/* src/hooks/mutations/useCheckinMutation.ts */

import { useCallback } from "react";
import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type CheckinData } from "../../types/hooks/data/checkinData";
import type { MutationState } from "../../types/hooks/mutations/mutationState";

import useMutationState from "./useMutationState";

interface UseCheckinMutationReturn extends MutationState<void> {
  saveCheckin: (dateKey: string, checkinData: Partial<CheckinData>) => Promise<void>;
}

/**
 * Mutation Hook that handles creating or updating occupant check-in data
 * under /checkins/<dateKey> in Firebase.
 */
export function useCheckinMutation(): UseCheckinMutationReturn {
  const database = useFirebaseDatabase();
  const { loading, error, run } = useMutationState();

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
      await run(async () => {
        const checkinRef = ref(database, `checkins/${dateKey}`);
        // `update()` merges data at /checkins/<dateKey> without overwriting the entire node
        await update(checkinRef, checkinData);
      });
    },
    [database, run]
  );

  return {
    saveCheckin,
    error,
    loading,
  };
}
