import { z } from "zod";
export declare const inventoryItemSchema: z.ZodObject<{
    sku: z.ZodString;
    productId: z.ZodString;
    variant: z.ZodObject<{
        size: z.ZodString;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        color?: string;
        size?: string;
    }, {
        color?: string;
        size?: string;
    }>;
    quantity: z.ZodNumber;
    lowStockThreshold: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    variant?: {
        color?: string;
        size?: string;
    };
    sku?: string;
    productId?: string;
    quantity?: number;
    lowStockThreshold?: number;
}, {
    variant?: {
        color?: string;
        size?: string;
    };
    sku?: string;
    productId?: string;
    quantity?: number;
    lowStockThreshold?: number;
}>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
//# sourceMappingURL=InventoryItem.d.ts.map
