import { z } from "zod";

export declare const variantAttributesSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const inventoryItemSchema: z.ZodObject<{
    sku: z.ZodString;
    productId: z.ZodString;
    quantity: z.ZodNumber;
    variantAttributes: z.ZodRecord<z.ZodString, z.ZodString>;
    lowStockThreshold: z.ZodOptional<z.ZodNumber>;
    wearCount: z.ZodOptional<z.ZodNumber>;
    wearAndTearLimit: z.ZodOptional<z.ZodNumber>;
    maintenanceCycle: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    quantity: number;
    sku: string;
    productId: string;
    variantAttributes: Record<string, string>;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
}, {
    quantity: number;
    sku: string;
    productId: string;
    variantAttributes: Record<string, string>;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
}>;
export type VariantAttributes = z.infer<typeof variantAttributesSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export interface SerializedInventoryItem {
    sku: string;
    quantity: number;
    variantAttributes?: VariantAttributes;
    [key: string]: unknown;
}
//# sourceMappingURL=InventoryItem.d.ts.map