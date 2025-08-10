import { z } from "zod";

export const inventoryItemSchema = z.object({
  sku: z.string(),
  variantAttributes: z.record(z.string()),
  quantity: z.number(),
  lowStockThreshold: z.number(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
