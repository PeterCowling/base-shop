// File: /src/orchestrations/barOrder/actions/mutations/useConfirmOrder.ts

import { useCallback, useMemo, useState } from "react";
import { get, ref, remove, set } from "firebase/database";

import useAllTransactions from "../../../../../hooks/mutations/useAllTransactionsMutations";
import { useFirebaseDatabase } from "../../../../../services/useFirebase";
import { type SalesOrder, type SalesOrderItem } from "../../../../../types/bar/BarTypes";
import { generateTransactionId } from "../../../../../utils/generateTransactionId";
import useInventoryItems from "../../../../data/inventory/useInventoryItems";
import useInventoryRecipes from "../../../../data/inventory/useInventoryRecipes";
import { useInventoryLedgerMutations } from "../../../../mutations/useInventoryLedgerMutations";

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

interface UseConfirmOrderProps {
  /**
   * Returns a category string (e.g. "Beer", "Coffee", "Kitchen", etc.)
   * given a product name. Used to categorize items in allFinancialTransactions.
   */
  getCategoryTypeByProductName: (productName: string) => string;
}

/**
 * useConfirmOrder:
 * - Provides functions to handle bar orders and sales in Firebase.
 * - Automatically logs each sale item to "allFinancialTransactions" (via addToAllTransactions).
 */
export function useConfirmOrder(props: UseConfirmOrderProps) {
  const { getCategoryTypeByProductName } = props;

  const [error, setError] = useState<unknown>(null);

  // Track which item is currently being removed (if any).
  const [removingItem, setRemovingItem] = useState<string | null>(null);

  const database = useFirebaseDatabase();
  const { items, itemsById } = useInventoryItems();
  const { recipes } = useInventoryRecipes();
  const { addLedgerEntry } = useInventoryLedgerMutations();
  const { addToAllTransactions } = useAllTransactions();
  const orderRef = useMemo(
    () => ref(database, "barOrders/unconfirmed"),
    [database]
  );

  const recordIngredientUsage = useCallback(
    async (saleItems: SalesOrderItem[], txnId: string): Promise<void> => {
      const missingProducts: string[] = [];
      const missingRecipes: string[] = [];
      const missingIngredients: string[] = [];

      for (const itm of saleItems) {
        const productName = itm.product;
        const productItem = items.find(
          (entry) =>
            entry.name.toLowerCase() === productName.toLowerCase() &&
            (entry.category ?? "").toLowerCase() !== "ingredient"
        );

        if (!productItem?.id) {
          missingProducts.push(productName);
          continue;
        }

        const recipe = recipes[productItem.id];
        if (!recipe) {
          missingRecipes.push(productName);
          continue;
        }

        for (const [ingredientId, quantityPerUnit] of Object.entries(
          recipe.items
        )) {
          const ingredient = itemsById[ingredientId];
          if (!ingredient) {
            missingIngredients.push(ingredientId);
            continue;
          }
          const qty = Math.abs(quantityPerUnit) * (itm.count ?? 1);
          if (!qty) continue;
          await addLedgerEntry({
            itemId: ingredientId,
            type: "sale",
            quantity: -qty,
            reference: `${txnId}:${productName}`,
            unit: ingredient.unit,
            note: "bar sale",
          });
        }
      }

      if (
        missingProducts.length > 0 ||
        missingRecipes.length > 0 ||
        missingIngredients.length > 0
      ) {
        console.warn("Missing recipe mappings", {
          missingProducts,
          missingRecipes,
          missingIngredients,
        });
      }
    },
    [addLedgerEntry, items, itemsById, recipes]
  );

  /**
   * confirmOrder:
   *  1) Reads /barOrders/unconfirmed
   *  2) Moves it to /barOrders/sales/<txnId>
   *  3) Logs each item to /allFinancialTransactions
   *  4) Removes /barOrders/unconfirmed
   */
  const confirmOrder = useCallback(
    async (
      bleepNumber: string,
      userName: string,
      time: string,
      paymentMethod: "cash" | "card"
    ): Promise<void> => {
      try {
        // 1) Load the current unconfirmed order
        const snapshot = await get(orderRef);
        if (!snapshot.exists()) {
          return;
        }
        const currentOrder = snapshot.val() as BarOrder;
        if (!currentOrder.items || currentOrder.items.length === 0) {
          return;
        }

        // 2) Create a new "txnId" node in /barOrders/sales/<txnId>
        const txnId = generateTransactionId();
        const newOrderRef = ref(database, `barOrders/sales/${txnId}`);

        // Convert items to final shape
        const finalItems: SalesOrderItem[] = currentOrder.items.map((item) => ({
          product: item.product,
          price: item.price,
          count: item.count,
          lineType: item.lineType || "bds",
        }));

        const finalOrder: SalesOrder = {
          orderKey: txnId,
          confirmed: true,
          bleepNumber,
          userName,
          time,
          paymentMethod,
          items: finalItems,
        };

        // 3) Write final order
        await set(newOrderRef, finalOrder);

        // 4) Remove unconfirmed (entire node)
        await remove(orderRef);

        // Update ingredient stock levels via recipes
        await recordIngredientUsage(finalItems, txnId);

        // 5) Log each item in /allFinancialTransactions
        for (let i = 0; i < finalItems.length; i++) {
          const itm = finalItems[i];
          const catType = getCategoryTypeByProductName(itm.product) || "Other";
          const itemAmount = (itm.price ?? 0) * (itm.count ?? 1);

          // e.g. "txn_20250318221943070-0"
          const transactionId = `${txnId}-${i}`;
          await addToAllTransactions(transactionId, {
            bookingRef: bleepNumber,
            occupantId: userName,
            amount: itemAmount,
            type: "barSale",
            method: paymentMethod,
            itemCategory: catType,
            count: itm.count,
            description: itm.product,
            // user_name is automatically applied in addToAllTransactions()
          });
        }
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [
      orderRef,
      database,
      addToAllTransactions,
      getCategoryTypeByProductName,
      recordIngredientUsage,
    ]
  );

  /**
   * createSale:
   * - Directly creates a sale in /barOrders/sales/<txnId>,
   *   using an existing transactionId if provided, or generating a new one otherwise.
   * - Logs each item to /allFinancialTransactions (for occupant's purchase).
   * - Returns the transaction ID.
   */
  const createSale = useCallback(
    async (
      items: BarOrderItem[],
      bleepNumber: string,
      occupantUuid: string,
      userName: string,
      time: string,
      paymentMethod: "cash" | "card",
      confirmed: boolean,
      existingTxnId?: string
    ): Promise<string | null> => {
      if (!items || items.length === 0) {
        return null;
      }

      try {
        // Use existing transaction ID if provided, otherwise generate a new one
        const txnId = existingTxnId || generateTransactionId();

        // Always store at /barOrders/sales/<txnId>
        const newOrderRef = ref(database, `barOrders/sales/${txnId}`);

        // Convert items to final shape
        const finalItems: SalesOrderItem[] = items.map((item) => ({
          product: item.product,
          price: item.price,
          count: item.count,
          lineType: item.lineType || "bds",
        }));

        const finalOrder: SalesOrder = {
          orderKey: txnId,
          confirmed,
          bleepNumber,
          userName,
          time,
          paymentMethod,
          items: finalItems,
        };

        // Write the sale to the final path
        await set(newOrderRef, finalOrder);

        // Update ingredient stock levels via recipes
        await recordIngredientUsage(finalItems, txnId);

        // Log each item in /allFinancialTransactions
        for (let i = 0; i < finalItems.length; i++) {
          const itm = finalItems[i];
          const catType = getCategoryTypeByProductName(itm.product) || "Other";
          const itemAmount = (itm.price ?? 0) * (itm.count ?? 1);
          const transactionId = `${txnId}-${i}`;

          // occupantId here is the occupant's UUID
          // user_name is set by addToAllTransactions
          await addToAllTransactions(transactionId, {
            bookingRef: bleepNumber,
            occupantId: occupantUuid, // occupant's UUID
            amount: itemAmount,
            type: "barSale",
            method: paymentMethod,
            itemCategory: catType,
            count: itm.count,
            description: itm.product,
          });
        }

        return txnId;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [
      database,
      addToAllTransactions,
      getCategoryTypeByProductName,
      recordIngredientUsage,
    ]
  );

  /**
   * removePreorderItem (example placeholder for single-item removal).
   * - Not used in current flow, but left as a reference for partial item removal logic.
   */
  const removePreorderItem = useCallback(
    async (productName: string): Promise<void> => {
      try {
        setRemovingItem(productName);
        // Wait 800ms to allow UI fade-out
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
        // Additional logic to remove from DB could go here...
        setRemovingItem(null);
      } catch (err) {
        setRemovingItem(null);
        setError(err);
        throw err;
      }
    },
    []
  );

  return useMemo(
    () => ({
      confirmOrder,
      createSale,
      removePreorderItem,
      removingItem,
      error,
    }),
    [confirmOrder, createSale, removePreorderItem, removingItem, error]
  );
}
