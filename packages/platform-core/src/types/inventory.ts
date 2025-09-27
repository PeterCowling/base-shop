import { z } from "zod";

export const variantAttributesSchema = z.record(z.string());

export const inventoryItemSchema = z
  .object({
    sku: z.string().min(1, "sku is required"), // i18n-exempt -- CORE-1014 validation message
    productId: z.string().min(1, "productId is required"), // i18n-exempt -- CORE-1014 validation message
    quantity: z.number().int().min(0),
    variantAttributes: variantAttributesSchema,
    lowStockThreshold: z.number().int().min(0).optional(),
    wearCount: z.number().int().min(0).optional(),
    wearAndTearLimit: z.number().int().min(0).optional(),
    maintenanceCycle: z.number().int().min(0).optional(),
  })
  .strict();

export type VariantAttributes = z.infer<typeof variantAttributesSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;

export function variantKey(
  sku: string,
  attrs: Record<string, string>,
): string {
  const variantPart = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return variantPart ? `${sku}#${variantPart}` : sku;
}

export const inventoryItemDtoSchema = z
  .object({
    sku: z.string().min(1, "sku is required"), // i18n-exempt -- CORE-1014 validation message
    productId: z.string().min(1, "productId is required"), // i18n-exempt -- CORE-1014 validation message
    quantity: z.number().int().min(0),
    variant: variantAttributesSchema.optional(),
    variantAttributes: variantAttributesSchema.optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    wearCount: z.number().int().min(0).optional(),
    wearAndTearLimit: z.number().int().min(0).optional(),
    maintenanceCycle: z.number().int().min(0).optional(),
  })
  .strict();
