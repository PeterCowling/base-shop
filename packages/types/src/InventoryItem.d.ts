import { z } from "zod";
export declare const inventoryItemSchema: z.ZodObject<{
    sku: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sku: string;
    quantity: number;
}, {
    sku: string;
    quantity: number;
}>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
//# sourceMappingURL=InventoryItem.d.ts.map