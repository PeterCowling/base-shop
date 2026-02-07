/* File: /src/hooks/orchestrations/bar/actions/mutations/useUpdateItemInOrder.ts */

import { useCallback, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";

import { useFirebaseFirestore } from "../../../services/useFirebase";
import { type BarOrder } from "../../../types/bar/BarTypes";

/**
 * Mutator Hook:
 * This hook updates an existing line item (by name) in the unconfirmed order:
 *   - Finds an existing item matching oldProductName
 *   - Renames it to newProductName
 *   - Adjusts its price
 *
 * Implementation details depend on how your Firestore structure is arranged.
 * Below is a generic approach you can adapt for your schema.
 */

interface UseUpdateItemInOrderProps {
  /**
   * unconfirmedOrder: The current order object (containing items).
   * orderDocPath: A Firestore doc path like "/barOrders/unconfirmed"
   * (or however you store the unconfirmed order).
   */
  unconfirmedOrder: BarOrder | null;
  orderDocPath: string;
}

export function useUpdateItemInOrder({
  unconfirmedOrder,
  orderDocPath,
}: UseUpdateItemInOrderProps) {
  const [updateError, setUpdateError] = useState<unknown>(null);
  const firestore = useFirebaseFirestore();

  /**
   * updateItemInOrder:
   * - Finds the item with oldProductName in unconfirmedOrder
   * - Renames it to newProductName, updates price
   * - Writes the updated array of items to Firestore
   *
   * Example usage:
   *   updateItemInOrder("Cappuccino", "Cappuccino + Soy Milk", 3.50)
   */
  const updateItemInOrder = useCallback(
    async (
      oldProductName: string,
      newProductName: string,
      newPrice: number
    ) => {
      try {
        if (!unconfirmedOrder) {
          throw new Error("No unconfirmed order found to update");
        }

        // Copy the existing items
        const newItems = [...unconfirmedOrder.items];

        // Find the item to update
        const targetIndex = newItems.findIndex(
          (it) => it.product === oldProductName
        );
        if (targetIndex === -1) {
          throw new Error(
            `Item "${oldProductName}" not found in unconfirmed order`
          );
        }

        // Update name + price in place
        newItems[targetIndex] = {
          ...newItems[targetIndex],
          product: newProductName,
          price: newPrice,
        };

        // Now persist back to Firestore (or your DB)
        const docRef = doc(firestore, orderDocPath);
        await updateDoc(docRef, { items: newItems });
      } catch (err) {
        setUpdateError(err);
      }
    },
    [unconfirmedOrder, orderDocPath, firestore]
  );

  return {
    updateItemInOrder,
    updateError,
  };
}
