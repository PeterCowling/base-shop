import { z } from "zod";

export const inventoryRecipeSchema = z.object({
  items: z.record(z.number()),
  note: z.string().optional(),
});

export const inventoryRecipesSchema = z.record(inventoryRecipeSchema);

export type InventoryRecipe = z.infer<typeof inventoryRecipeSchema>;
export type InventoryRecipes = z.infer<typeof inventoryRecipesSchema>;
