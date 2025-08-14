import { z } from "zod";
export declare const variantAttributesSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const inventoryItemSchema: z.ZodObject<{
    sku: z.ZodString;
    productId: z.ZodString;
    variantAttributes: z.ZodRecord<z.ZodString, z.ZodString>;
    quantity: z.ZodNumber;
    lowStockThreshold: z.ZodOptional<z.ZodNumber>;
    wearCount: z.ZodOptional<z.ZodNumber>;
    wearAndTearLimit: z.ZodOptional<z.ZodNumber>;
    maintenanceCycle: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sku?: string;
    productId?: string;
    variantAttributes?: Record<string, string>;
    quantity?: number;
    lowStockThreshold?: number;
    wearCount?: number;
    wearAndTearLimit?: number;
    maintenanceCycle?: number;
}, {
    sku?: string;
    productId?: string;
    variantAttributes?: Record<string, string>;
    quantity?: number;
    lowStockThreshold?: number;
    wearCount?: number;
    wearAndTearLimit?: number;
    maintenanceCycle?: number;
}>;
export type VariantAttributes = z.infer<typeof variantAttributesSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
//# sourceMappingURL=InventoryItem.d.ts.map
