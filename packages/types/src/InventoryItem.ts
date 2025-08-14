import { z } from "zod";

// Flexible map of variant attributes (e.g. size, color)
export const variantAttributesSchema = z.record(z.string());

export const inventoryItemSchema = z
  .object({
    sku: z.string(),
    productId: z.string(),
    quantity: z.number().int().min(0),
    // Each variant attribute is a free-form key/value string pair
    variantAttributes: variantAttributesSchema,
    lowStockThreshold: z.number().int().min(0).optional(),
    wearCount: z.number().int().min(0).optional(),
    wearAndTearLimit: z.number().int().min(0).optional(),
    maintenanceCycle: z.number().int().min(0).optional(),
  })
  .strict();

export type VariantAttributes = z.infer<typeof variantAttributesSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Shape used when persisting inventory data to external stores (e.g. JSON, SQL).
// Contains only the primitive fields required to reconstruct an InventoryItem,
// while allowing additional properties to round-trip without using `any`.
export interface SerializedInventoryItem {
  sku: string;
  quantity: number;
  variantAttributes?: VariantAttributes;
  [key: string]: unknown;
}
