/* src/hooks/orchestrations/bar/actions/mutations/useOrderActions.ts
 *
 * This hook exposes helpers for manipulating bar sales orders in Firebase.
 * Orders are stored under the `barOrders/sales` node and, when items
 * are removed, the removed portion of an order is appended to the
 * `barOrders/completed` node. Removing a full order will delete it
 * from `sales`; removing a subset of items will update the remaining
 * items in place and record the removed items under `completed`.
 *
 * The implementation relies on Firebase Realtime Database helpers
 * imported from `firebase/database` and a custom `useFirebaseDatabase`
 * hook which resolves the active database connection. Consumers of this
 * hook receive two asynchronous methods: `removeItems` and
 * `removeSingleItem`. Both return a boolean indicating whether the
 * entire order was removed from the `sales` node.
 */

import { useCallback } from "react";
import { get, ref, remove, update } from "firebase/database";

import { useFirebaseDatabase } from "../../../../../services/useFirebase";
import type {
  SalesOrder,
  SalesOrderItem,
} from "../../../../../types/bar/BarTypes";

/**
 * Internal helper that appends a list of items to the completed node.
 *
 * When removing either all items or a subset from an order, this
 * function ensures that the same transaction (`orderKey`) is
 * preserved in the completed node. It merges any existing completed
 * items with those being removed and updates the database in a single
 * call. If the completed order does not yet exist, a new one is
 * created.
 *
 * @param database Active Firebase database connection
 * @param order Original sales order
 * @param removedItems Items to append to the completed node
 */
async function moveItemsToCompleted(
  database: ReturnType<typeof useFirebaseDatabase>,
  order: SalesOrder,
  removedItems: SalesOrderItem[]
): Promise<void> {
  const completedRef = ref(database, `barOrders/completed/${order.orderKey}`);
  const snapshot = await get(completedRef);
  const existingCompleted = snapshot.val() as SalesOrder | null;

  // Combine new removed items with any existing items in "completed"
  const existingItems = existingCompleted?.items ?? [];
  const updatedItems = [...existingItems, ...removedItems];

  // Merge any relevant order fields to maintain consistency
  const updatedCompletedOrder: SalesOrder = {
    ...existingCompleted,
    ...order,
    items: updatedItems,
  };

  await update(completedRef, updatedCompletedOrder);
}

/**
 * Exposes functions to remove items or single items from a bar order.
 *
 * All modifications to Firebase are performed via async calls. When
 * removing items, the removed portion of the order is appended to the
 * `barOrders/completed` node. The return value of each function
 * indicates whether the entire order was removed from `barOrders/sales`.
 */
export function useOrderActions() {
  const database = useFirebaseDatabase();

  /**
   * Remove items from an order based on a filter. Valid filters are
   * `"ALL"`, `"BDS"` and `"KDS"`. When `"ALL"` is passed the
   * entire order is moved to `completed` and removed from `sales`.
   * Otherwise only items matching the provided filter (case‑insensitive)
   * are removed and the remaining items (if any) are updated in place.
   *
   * @param order The order to modify
   * @param filter One of "ALL", "BDS" or "KDS"
   * @returns Promise resolved to true if the order was fully removed
   */
  const removeItems = useCallback(
    async (
      order: SalesOrder,
      filter: "ALL" | "BDS" | "KDS"
    ): Promise<boolean> => {
      const orderRef = ref(database, `barOrders/sales/${order.orderKey}`);

      if (filter === "ALL") {
        // Move entire order to "completed"
        await moveItemsToCompleted(database, order, order.items);
        // Remove entire order from "sales"
        await remove(orderRef);
        return true;
      }

      // Separate items to remove vs items to keep
      const removedItems: SalesOrderItem[] = order.items.filter(
        (item) => item.lineType === filter.toLowerCase()
      );
      const remainingItems: SalesOrderItem[] = order.items.filter(
        (item) => item.lineType !== filter.toLowerCase()
      );

      // Move only the removed items to "completed"
      if (removedItems.length > 0) {
        await moveItemsToCompleted(database, order, removedItems);
      }

      if (remainingItems.length === 0) {
        // No items remain ⇒ remove entire order
        await remove(orderRef);
        return true;
      }

      // Update the order with remaining items
      await update(orderRef, { ...order, items: remainingItems });
      return false;
    },
    [database]
  );

  /**
   * Remove a single item at the given index from an order. The removed
   * item is appended to the `completed` node. If no items remain
   * afterwards, the sales order is deleted.
   *
   * @param order Order to modify
   * @param index Zero‑based index of item to remove
   * @returns Promise resolved to true if the order was fully removed
   */
  const removeSingleItem = useCallback(
    async (order: SalesOrder, index: number): Promise<boolean> => {
      const orderRef = ref(database, `barOrders/sales/${order.orderKey}`);
      const updatedItems = [...order.items];
      const [removedItem] = updatedItems.splice(index, 1);

      if (removedItem) {
        // Move the single removed item to "completed"
        await moveItemsToCompleted(database, order, [removedItem]);
      }

      if (updatedItems.length === 0) {
        // No items remain ⇒ remove entire order
        await remove(orderRef);
        return true;
      }

      // Update order with remaining items
      await update(orderRef, { ...order, items: updatedItems });
      return false;
    },
    [database]
  );

  return { removeItems, removeSingleItem };
}
