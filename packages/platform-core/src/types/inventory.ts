import { z } from "zod";

export const variantAttributesSchema = z.record(z.string());

export const inventoryValidationItemSchema = z
  .object({
    sku: z.string().min(1, "sku is required"), // i18n-exempt -- CORE-1014 validation message
    quantity: z.number().int().min(1, "quantity must be >= 1"), // i18n-exempt -- CORE-1014 validation message
    variantAttributes: variantAttributesSchema.optional(),
    variantKey: z.string().min(1).optional(),
  })
  .strict();

export const inventoryValidationBodySchema = z
  .object({
    shopId: z.string().min(1).optional(),
    items: z.array(inventoryValidationItemSchema).min(1),
  })
  .strict();

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
export type InventoryValidationBody = z.infer<typeof inventoryValidationBodySchema>;
export type InventoryValidationItem = z.infer<typeof inventoryValidationItemSchema>;
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

export function parseVariantKey(
  key: string,
): { sku: string; variantAttributes: Record<string, string> } | null {
  const trimmed = key.trim();
  if (!trimmed) return null;

  const hashIndex = trimmed.indexOf("#");
  const sku = hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex);
  if (!sku) return null;

  if (hashIndex === -1) {
    return { sku, variantAttributes: {} };
  }

  const variantPart = trimmed.slice(hashIndex + 1);
  if (!variantPart) return null;

  const variantAttributes: Record<string, string> = {};
  for (const segment of variantPart.split("|")) {
    if (!segment) return null;
    const colonIndex = segment.indexOf(":");
    if (colonIndex === -1) return null;
    const k = segment.slice(0, colonIndex);
    const v = segment.slice(colonIndex + 1);
    if (!k || !v) return null;
    if (k in variantAttributes) return null;
    variantAttributes[k] = v;
  }

  return { sku, variantAttributes };
}

export function normalizeInventoryValidationItem(
  item: InventoryValidationItem,
): { sku: string; quantity: number; variantAttributes?: Record<string, string> } | { error: string } {
  if (item.variantAttributes && item.variantKey) {
    const computed = variantKey(item.sku, item.variantAttributes);
    if (computed !== item.variantKey) {
      return { error: "variantKey does not match variantAttributes" }; // i18n-exempt -- CORE-1014 validation message
    }
    return {
      sku: item.sku,
      quantity: item.quantity,
      variantAttributes: Object.keys(item.variantAttributes).length
        ? item.variantAttributes
        : undefined,
    };
  }

  if (item.variantAttributes) {
    return {
      sku: item.sku,
      quantity: item.quantity,
      variantAttributes: Object.keys(item.variantAttributes).length
        ? item.variantAttributes
        : undefined,
    };
  }

  if (item.variantKey) {
    const parsed = parseVariantKey(item.variantKey);
    if (!parsed) {
      return { error: "invalid variantKey format" }; // i18n-exempt -- CORE-1014 validation message
    }
    if (parsed.sku !== item.sku) {
      return { error: "variantKey sku does not match sku field" }; // i18n-exempt -- CORE-1014 validation message
    }
    return {
      sku: item.sku,
      quantity: item.quantity,
      variantAttributes: Object.keys(parsed.variantAttributes).length
        ? parsed.variantAttributes
        : undefined,
    };
  }

  return { sku: item.sku, quantity: item.quantity };
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
