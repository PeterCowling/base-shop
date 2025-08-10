import { z } from "zod";

export const inventoryItemSchema = z.object({
  sku: z.string(),
  productId: z.string(),
  variant: z.object({
    size: z.string(),
    color: z.string().optional(),
  }),
  quantity: z.number(),
  lowStockThreshold: z.number().optional(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
