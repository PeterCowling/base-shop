/* File: src/orchestrations/barOrder/actions/mutations/useClearOrder.ts */

import { useCallback, useMemo, useState } from "react";
import { get, ref, remove } from "firebase/database";

import { useFirebaseDatabase } from "../../../../../services/useFirebase";

/**
 * useClearOrder:
 * Removes the entire /barOrders/unconfirmed node.
 */
export function useClearOrder() {
  const [error, setError] = useState<unknown>(null);
  const database = useFirebaseDatabase();
  const orderRef = useMemo(
    () => ref(database, "barOrders/unconfirmed"),
    [database]
  );

  const clearOrder = useCallback(async () => {
    try {
      const snapshot = await get(orderRef);
      if (!snapshot.exists()) {
        return;
      }
      await remove(orderRef);
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [orderRef]);

  return useMemo(
    () => ({
      clearOrder,
      error,
    }),
    [clearOrder, error]
  );
}
