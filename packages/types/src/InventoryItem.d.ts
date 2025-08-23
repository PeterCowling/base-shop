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
    sku: string;
    productId: string;
    quantity: number;
    variantAttributes: Record<string, string>;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
}, {
    sku: string;
    productId: string;
    quantity: number;
    variantAttributes: Record<string, string>;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
}>;
export type VariantAttributes = z.infer<typeof variantAttributesSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export interface SerializedInventoryItem {
    sku: string;
    quantity: number;
    variantAttributes?: VariantAttributes;
    [key: string]: unknown;
}
