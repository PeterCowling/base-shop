/* File: /src/hooks/orchestrations/bar/actions/mutations/useAddItemToOrder.ts
   ------------------------------------------------------------------
   Accept category: string | null, defaulting to "bds" if null.
   This prevents the error when passing a null category.
   ------------------------------------------------------------------ */

import { useCallback, useMemo, useState } from "react";
import { get, ref, set } from "firebase/database";

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

/** Optional config for customizing lineType assignment. */
interface UseAddItemToOrderProps {
  mapToLineType?: (category: string | null) => "kds" | "bds";
}

/**
 * Mutator Hook:
 * Adds an item to the unconfirmed bar order (stored in RTDB).
 */
export function useAddItemToOrder({ mapToLineType }: UseAddItemToOrderProps) {
  const [error, setError] = useState<unknown>(null);

  // Adjust this to your actual RTDB path if needed.
  const database = useFirebaseDatabase();
  const orderRef = useMemo(
    () => ref(database, "barOrders/unconfirmed"),
    [database]
  );

  const addItemToOrder = useCallback(
    async (product: string, price: number, category: string | null = "bds") => {
      try {
        const snapshot = await get(orderRef);

        let currentOrder: BarOrder = {
          confirmed: false,
          items: [],
        };

        if (snapshot.exists()) {
          const existing = snapshot.val() as Partial<BarOrder>;
          currentOrder = {
            confirmed: !!existing.confirmed,
            items: Array.isArray(existing.items) ? existing.items : [],
          };
        }

        // Determine line type (default "bds" unless mapToLineType was provided).
        let lineType: "bds" | "kds" = "bds";
        if (mapToLineType) {
          lineType = mapToLineType(category);
        }

        const newItem: BarOrderItem = {
          product,
          price,
          lineType,
          count: 1,
        };

        // Merge with existing item if it's the same product + lineType + price
        const idx = currentOrder.items.findIndex(
          (it) =>
            it.product === newItem.product &&
            it.lineType === newItem.lineType &&
            it.price === newItem.price
        );
        if (idx >= 0) {
          currentOrder.items[idx] = {
            ...currentOrder.items[idx],
            count: currentOrder.items[idx].count + 1,
          };
        } else {
          currentOrder.items.push(newItem);
        }

        await set(orderRef, {
          confirmed: currentOrder.confirmed,
          items: currentOrder.items,
        });
      } catch (err) {
        setError(err);
      }
    },
    [orderRef, mapToLineType]
  );

  return { addItemToOrder, error };
}
