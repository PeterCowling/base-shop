/* src/hook/mutations/useCCDetailsMutations.ts */
import { useCallback } from "react";
import { ref, set } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import type { CCDetails } from "../../types/hooks/data/ccData";
import type { MutationState } from "../../types/hooks/mutations/mutationState";

import useMutationState from "./useMutationState";

interface UseCCDetailsMutationsReturn extends MutationState<void> {
  saveCCDetails: (
    bookingRef: string,
    occupantId: string,
    details: CCDetails
  ) => Promise<void>;
}

/**
 * Mutation Hook: Handles saving credit card details to /cc.
 *
 * - saveCCDetails: Overwrites occupant's CC data at cc/<bookingRef>/<occupantId>.
 */
export default function useCCDetailsMutations(): UseCCDetailsMutationsReturn {
  const database = useFirebaseDatabase();
  const { loading, error, run } = useMutationState();

  /**
   * Saves credit card details for a particular occupant's booking.
   */
  const saveCCDetails = useCallback(
    async (bookingRef: string, occupantId: string, details: CCDetails) => {
      await run(async () => {
        const path = `cc/${bookingRef}/${occupantId}`;
        await set(ref(database, path), details);
      });
    },
    [database, run]
  );

  return {
    saveCCDetails,
    error,
    loading,
  };
}
