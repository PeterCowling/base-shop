import { z } from "zod";

export const inventoryItemSchema = z.object({
  sku: z.string(),
  quantity: z.number(),
  lowStockThreshold: z.number().optional(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
