import { z } from "zod";

export const variantAttributesSchema = z.record(z.string());

export const inventoryItemSchema = z.object({
  sku: z.string(),
  productId: z.string(),
  variantAttributes: variantAttributesSchema,
  quantity: z.number(),
  lowStockThreshold: z.number().optional(),
});

export type VariantAttributes = z.infer<typeof variantAttributesSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
