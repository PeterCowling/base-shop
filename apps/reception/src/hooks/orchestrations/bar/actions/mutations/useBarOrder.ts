// File: /src/hooks/orchestrations/bar/actions/mutations/useBarOrder.ts
import { useCallback } from "react";

import { useAddItemToOrder } from "./useAddItemToOrder";
import { useClearOrder } from "./useClearOrder";
import { useConfirmOrder } from "./useConfirmOrder";
import { useRemoveItemFromOrder } from "./useRemoveItemFromOrder";
import { useUpdateItemInOrder } from "./useUpdateItemInOrder";
import { useUnconfirmedBarOrderData } from "../../../../data/bar/useUnconfirmedBarOrderData";

/** Pure helper: route kitchen codes to “kds”, everything else to “bds” */
function mapToLineType(categoryCode: string | null): "bds" | "kds" {
  return categoryCode?.toLowerCase().startsWith("k") ? "kds" : "bds";
}

/** Pure helper: determine category when confirming order */
function getCategoryTypeByProductName(_productName: string): string {
  // your logic here
  return "Other";
}

/**
 * Data‑Orchestrator Hook:
 * Bundles reads + all mutations for the unconfirmed‑order flow.
 */
export function useBarOrder() {
  const {
    unconfirmedOrder,
    loading,
    error: baseError,
  } = useUnconfirmedBarOrderData();

  const { addItemToOrder: _add, error: addError } = useAddItemToOrder({
    mapToLineType,
  });
  const { removeItemFromOrder: _remove, error: removeError } =
    useRemoveItemFromOrder();
  const { clearOrder: _clear, error: clearError } = useClearOrder();
  const { confirmOrder: _confirm, error: confirmError } = useConfirmOrder({
    getCategoryTypeByProductName,
  });

  // <-- Pass the correct RTDB path (no leading slash) -->
  const { updateItemInOrder: _update, error: updateError } =
    useUpdateItemInOrder({
      unconfirmedOrder,
      orderRefPath: "barOrders/unconfirmed",
    });

  const addItemToOrder = useCallback(
    (product: string, price: number, categoryCode: string | null) =>
      _add(product, price, categoryCode),
    [_add]
  );

  const removeItemFromOrder = useCallback(
    (product: string) => _remove(product),
    [_remove]
  );

  const clearOrder = useCallback(() => _clear(), [_clear]);

  const confirmOrder = useCallback(
    (
      bleepNumber: string,
      userName: string,
      time: string,
      paymentMethod: "cash" | "card"
    ) => _confirm(bleepNumber, userName, time, paymentMethod),
    [_confirm]
  );

  const updateItemInOrder = useCallback(
    (oldName: string, newName: string, newPrice: number) =>
      _update(oldName, newName, newPrice),
    [_update]
  );

  const error =
    baseError ||
    addError ||
    removeError ||
    clearError ||
    confirmError ||
    updateError;

  return {
    unconfirmedOrder,
    loading,
    error,
    addItemToOrder,
    removeItemFromOrder,
    clearOrder,
    confirmOrder,
    updateItemInOrder,
  };
}
