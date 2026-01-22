/* File: /src/hooks/orchestrations/bar/actions/mutations/useUpdateItemInOrder.ts
   ------------------------------------------------------------------
   Updated to reference UnconfirmedSalesOrder from BarTypes.
   ------------------------------------------------------------------ */

import { useCallback, useMemo, useState } from "react";
import { get, ref, set } from "firebase/database";

import { useFirebaseDatabase } from "../../../../../services/useFirebase";
import {
  type SalesOrderItem,
  type UnconfirmedSalesOrder,
} from "../../../../../types/bar/BarTypes";

interface UseUpdateItemInOrderProps {
  unconfirmedOrder: UnconfirmedSalesOrder | null;
  /** RTDB path to the “unconfirmed” node (no leading slash) */
  orderRefPath?: string;
}

/**
 * Mutator Hook:
 * Reads `/barOrders/unconfirmed`, renames one item and adjusts its price,
 * then writes the new array back.
 */
export function useUpdateItemInOrder(props: UseUpdateItemInOrderProps) {
  const {
    unconfirmedOrder: _unconfirmedOrder,
    orderRefPath = "barOrders/unconfirmed",
  } = props;
  const [error, setError] = useState<unknown>(null);

  const database = useFirebaseDatabase();
  const orderRef = useMemo(
    () => ref(database, orderRefPath),
    [database, orderRefPath]
  );

  const updateItemInOrder = useCallback(
    async (oldName: string, newName: string, newPrice: number) => {
      try {
        const snapshot = await get(orderRef);

        let currentOrder: UnconfirmedSalesOrder = {
          confirmed: false,
          items: [],
        };

        if (snapshot.exists()) {
          const existing = snapshot.val() as Partial<UnconfirmedSalesOrder>;
          currentOrder = {
            confirmed: !!existing.confirmed,
            items: Array.isArray(existing.items) ? existing.items : [],
          };
        }

        // Adjust the target item
        const updatedItems = currentOrder.items.map((item: SalesOrderItem) => {
          if (item.product === oldName) {
            return {
              ...item,
              product: newName,
              price: newPrice,
            };
          }
          return item;
        });

        currentOrder.items = updatedItems;

        await set(orderRef, currentOrder);
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [orderRef]
  );

  return { updateItemInOrder, error };
}
