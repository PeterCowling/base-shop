import { useCallback, useMemo } from "react";
import { ref, remove, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { inventoryRecipeSchema } from "../../schemas/inventoryRecipeSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { InventoryRecipe } from "../../types/hooks/data/inventoryRecipeData";
import { getErrorMessage } from "../../utils/errorMessage";
import { showToast } from "../../utils/toastUtils";

export function useInventoryRecipesMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const saveRecipe = useCallback(
    async (itemId: string, recipe: InventoryRecipe): Promise<void> => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      const trimmedId = itemId.trim();
      if (!trimmedId) {
        showToast("Inventory item ID is required.", "error");
        return;
      }
      const result = inventoryRecipeSchema.safeParse(recipe);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return;
      }
      await set(ref(database, `inventory/recipes/${trimmedId}`), result.data);
    },
    [database, user]
  );

  const removeRecipe = useCallback(
    async (recipeId: string): Promise<void> => {
      if (!user) {
        showToast("Not authorized. Please log in.", "error");
        return;
      }
      const trimmedId = recipeId.trim();
      if (!trimmedId) {
        showToast("Recipe ID is required.", "error");
        return;
      }
      await remove(ref(database, `inventory/recipes/${trimmedId}`));
    },
    [database, user]
  );

  return useMemo(
    () => ({
      saveRecipe,
      removeRecipe,
    }),
    [saveRecipe, removeRecipe]
  );
}
