/* src/hooks/mutations/useCheckoutsMutation.ts */

import { ref, update } from "firebase/database";
import { useCallback, useState } from "react";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { CheckoutData } from "../../types/hooks/data/checkoutsData";

/**
 * Mutation Hook that handles creating or updating occupant check-out data
 * at /checkouts/<dateKey> in Firebase.
 */
export function useCheckoutsMutation() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

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
      try {
        const checkoutRef = ref(database, `checkouts/${dateKey}`);
        await update(checkoutRef, checkoutData);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [database]
  );

  return {
    saveCheckout,
    error,
  };
}
