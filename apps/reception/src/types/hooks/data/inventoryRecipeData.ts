// src/types/hooks/data/inventoryRecipeData.ts

export interface InventoryRecipe {
  items: Record<string, number>;
  note?: string;
}

export type InventoryRecipes = Record<string, InventoryRecipe> | null;