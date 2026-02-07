import { useCallback, useMemo } from "react";
import { push, ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { inventoryItemSchema } from "../../schemas/inventoryItemSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { InventoryItem } from "../../types/hooks/data/inventoryItemData";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

export function useInventoryItemsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const createInventoryItem = useCallback(
    async (item: InventoryItem): Promise<string | null> => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return null;
      }
      const newRef = push(ref(database, "inventory/items"));
      const payload: InventoryItem = {
        ...item,
        openingCount: item.openingCount ?? 0,
        active: item.active ?? true,
      };
      const result = inventoryItemSchema.safeParse(payload);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return null;
      }
      await set(newRef, result.data);
      return newRef.key;
    },
    [database, user]
  );

  const saveInventoryItem = useCallback(
    async (itemId: string, item: InventoryItem): Promise<void> => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      const payload: InventoryItem = {
        ...item,
        openingCount: item.openingCount ?? 0,
        active: item.active ?? true,
      };
      const result = inventoryItemSchema.safeParse(payload);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return;
      }
      await set(ref(database, `inventory/items/${itemId}`), result.data);
    },
    [database, user]
  );

  return useMemo(
    () => ({
      createInventoryItem,
      saveInventoryItem,
    }),
    [createInventoryItem, saveInventoryItem]
  );
}