import { z } from "zod";
export declare const inventoryItemSchema: z.ZodObject<{
    sku: z.ZodString;
    variantAttributes: z.ZodRecord<z.ZodString, z.ZodString>;
    quantity: z.ZodNumber;
    lowStockThreshold: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sku: string;
    variantAttributes: Record<string, string>;
    quantity: number;
    lowStockThreshold: number;
}, {
    sku: string;
    variantAttributes: Record<string, string>;
    quantity: number;
    lowStockThreshold: number;
}>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
//# sourceMappingURL=InventoryItem.d.ts.map
