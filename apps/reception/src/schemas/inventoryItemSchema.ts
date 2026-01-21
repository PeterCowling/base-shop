import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string(),
  unit: z.string(),
  openingCount: z.number(),
  reorderThreshold: z.number().optional(),
  category: z.string().optional(),
  active: z.boolean().optional(),
  recipeMap: z.record(z.number()).optional(),
});

export const inventoryItemsSchema = z.record(inventoryItemSchema);

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type InventoryItems = z.infer<typeof inventoryItemsSchema>;