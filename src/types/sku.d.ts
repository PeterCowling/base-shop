import { z } from "zod";
/** Runtime validator + compile-time source of truth */
export declare const skuSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    /** Unit price in minor currency units (e.g. cents) */
    price: z.ZodNumber;
    /** Refundable deposit, required by business rules */
    deposit: z.ZodNumber;
    image: z.ZodString;
    sizes: z.ZodArray<z.ZodString, "many">;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
    slug?: string;
    title?: string;
    price?: number;
    deposit?: number;
    image?: string;
    sizes?: string[];
    description?: string;
}, {
    id?: string;
    slug?: string;
    title?: string;
    price?: number;
    deposit?: number;
    image?: string;
    sizes?: string[];
    description?: string;
}>;
export type SKU = z.infer<typeof skuSchema>;
//# sourceMappingURL=sku.d.ts.map