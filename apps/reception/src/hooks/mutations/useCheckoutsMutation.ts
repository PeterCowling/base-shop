/* src/hooks/mutations/useCheckoutsMutation.ts */

import { useCallback } from "react";
import { ref, update } from "firebase/database";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { type CheckoutData } from "../../types/hooks/data/checkoutsData";
import type { MutationState } from "../../types/hooks/mutations/mutationState";

import useMutationState from "./useMutationState";

interface UseCheckoutsMutationReturn extends MutationState<void> {
  saveCheckout: (
    dateKey: string,
    checkoutData: Partial<Record<string, CheckoutData[string] | null>>
  ) => Promise<void>;
}

/**
 * Mutation Hook that handles creating or updating occupant check-out data
 * at /checkouts/<dateKey> in Firebase.
 */
export function useCheckoutsMutation(): UseCheckoutsMutationReturn {
  const database = useFirebaseDatabase();
  const { loading, error, run } = useMutationState();

  /**
   * saveCheckout merges new occupant data at /checkouts/<dateKey>
   * (i.e., it won't overwrite the entire date).
   *
   * Passing a value of `null` for a specific occupantId removes that
   * checkout record from Firebase.
   *
   * @param dateKey     The date in YYYY-MM-DD format.
   * @param checkoutData Key-value pairs of occupantId -> { reservationCode, timestamp }
   */
  const saveCheckout = useCallback(
    async (
      dateKey: string,
      checkoutData: Partial<Record<string, CheckoutData[string] | null>>
    ): Promise<void> => {
      await run(async () => {
        const checkoutRef = ref(database, `checkouts/${dateKey}`);
        await update(checkoutRef, checkoutData);
      });
    },
    [database, run]
  );

  return {
    saveCheckout,
    error,
    loading,
  };
}
