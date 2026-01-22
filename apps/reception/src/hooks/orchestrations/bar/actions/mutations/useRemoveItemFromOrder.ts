/* File: /src/hooks/orchestrations/bar/actions/mutations/useRemoveItemFromOrder.ts
   ------------------------------------------------------------------
   Make the _props parameter optional, allowing useRemoveItemFromOrder()
   to be called with zero arguments. Also remain fully typed to avoid `any`.
   ------------------------------------------------------------------ */

import { useCallback, useMemo, useState } from "react";
import { get, ref, remove, set } from "firebase/database";

import { useFirebaseDatabase } from "../../../../../services/useFirebase";

interface BarOrderItem {
  product: string;
  price: number;
  count: number;
  lineType?: "bds" | "kds";
}

interface BarOrder {
  confirmed: boolean;
  items: BarOrderItem[];
}

type UseRemoveItemFromOrderProps = Record<string, unknown>;

/**
 * useRemoveItemFromOrder:
 * Decrements or removes a single item from /barOrders/unconfirmed.
 */
export function useRemoveItemFromOrder(
  _props: UseRemoveItemFromOrderProps = {}
) {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  /**
   * Memoize the reference to "barOrders/unconfirmed" in Firebase.
   */
  const orderRef = useMemo(
    () => ref(database, "barOrders/unconfirmed"),
    [database]
  );

  /**
   * Decrements an item's count or removes it entirely if count is 1.
   * If the resulting order is empty, remove it from Firebase.
   * Throws an error if the operation fails.
   */
  const removeItemFromOrder = useCallback(
    async (product: string) => {
      try {
        const snapshot = await get(orderRef);
        if (!snapshot.exists()) {
          return;
        }

        const currentOrder = snapshot.val() as BarOrder;
        if (currentOrder.confirmed) {
          // If it's already confirmed, do nothing
          return;
        }

        const itemsCopy = [...currentOrder.items];
        const idx = itemsCopy.findIndex((i) => i.product === product);

        if (idx === -1) {
          return;
        }

        if (itemsCopy[idx].count > 1) {
          itemsCopy[idx].count -= 1;
        } else {
          itemsCopy.splice(idx, 1);
        }

        if (itemsCopy.length === 0) {
          await remove(orderRef);
        } else {
          await set(orderRef, { confirmed: false, items: itemsCopy });
        }
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [orderRef]
  );

  return useMemo(
    () => ({
      removeItemFromOrder,
      error,
    }),
    [removeItemFromOrder, error]
  );
}
