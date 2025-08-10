import { z } from "zod";
export declare const inventoryItemSchema: z.ZodObject<{
    sku: z.ZodString;
    quantity: z.ZodNumber;
    lowStockThreshold: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sku: string;
    quantity: number;
    lowStockThreshold?: number | undefined;
}, {
    sku: string;
    quantity: number;
    lowStockThreshold?: number | undefined;
}>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
//# sourceMappingURL=InventoryItem.d.ts.map