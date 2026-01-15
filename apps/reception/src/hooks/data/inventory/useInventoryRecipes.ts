import { useMemo } from "react";

import { inventoryRecipesSchema } from "../../../schemas/inventoryRecipeSchema";
import type { InventoryRecipe } from "../../../types/hooks/data/inventoryRecipeData";
import useFirebaseSubscription from "../useFirebaseSubscription";

export default function useInventoryRecipes() {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, InventoryRecipe>
  >("inventory/recipes", inventoryRecipesSchema);

  const recipes = useMemo(() => data ?? {}, [data]);

  return useMemo(
    () => ({
      recipes,
      loading,
      error,
    }),
    [recipes, loading, error]
  );
}