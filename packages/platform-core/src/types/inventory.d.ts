import { type z } from "zod";

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
    productId: string;
    sku: string;
    quantity: number;
    variantAttributes: Record<string, string>;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
}, {
    productId: string;
    sku: string;
    quantity: number;
    variantAttributes: Record<string, string>;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
}>;
export type VariantAttributes = z.infer<typeof variantAttributesSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export declare function variantKey(sku: string, attrs: Record<string, string>): string;
export declare const inventoryItemDtoSchema: z.ZodObject<{
    sku: z.ZodString;
    productId: z.ZodString;
    quantity: z.ZodNumber;
    variant: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    variantAttributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    lowStockThreshold: z.ZodOptional<z.ZodNumber>;
    wearCount: z.ZodOptional<z.ZodNumber>;
    wearAndTearLimit: z.ZodOptional<z.ZodNumber>;
    maintenanceCycle: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    productId: string;
    sku: string;
    quantity: number;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
    variantAttributes?: Record<string, string> | undefined;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
    variant?: Record<string, string> | undefined;
}, {
    productId: string;
    sku: string;
    quantity: number;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
    variantAttributes?: Record<string, string> | undefined;
    lowStockThreshold?: number | undefined;
    wearCount?: number | undefined;
    variant?: Record<string, string> | undefined;
}>;
