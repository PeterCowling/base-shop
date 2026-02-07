// File: /src/hooks/orchestrations/bar/actions/mutations/useDeletePreorder.ts

import { useCallback, useMemo, useState } from "react";
import { getDatabase, ref, remove } from "firebase/database";

/**
 * useDeletePreorder
 * Provides a function to delete a preorder from Firebase,
 * given the preorder type ("breakfastPreorders" or "evDrinkPreorders"),
 * the month name (e.g. "July"), the day (e.g. "21"), and the transactionId to remove.
 */
export function useDeletePreorder() {
  const [error, setError] = useState<unknown>(null);

  /**
   * deletePreorder:
   * Removes the preorder from
   *   /barOrders/<preorderType>/<monthName>/<day>/<transactionId>
   */
  const deletePreorder = useCallback(
    async (
      transactionId: string,
      preorderType: string,
      monthName: string,
      day: string
    ) => {
      try {
        const db = getDatabase();
        const preorderRef = ref(
          db,
          `barOrders/${preorderType}/${monthName}/${day}/${transactionId}`
        );
        await remove(preorderRef);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    []
  );

  return useMemo(
    () => ({
      deletePreorder,
      error,
    }),
    [deletePreorder, error]
  );
}
