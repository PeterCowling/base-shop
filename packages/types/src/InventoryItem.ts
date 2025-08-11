import { z } from "zod";

// Flexible map of variant attributes (e.g. size, color)
export const variantAttributesSchema = z.record(z.string());

export const inventoryItemSchema = z.object({
  sku: z.string(),
  productId: z.string(),
  quantity: z.number(),
  // Each variant attribute is a free-form key/value string pair
  variantAttributes: variantAttributesSchema,
  lowStockThreshold: z.number().optional(),
});

export type VariantAttributes = z.infer<typeof variantAttributesSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
