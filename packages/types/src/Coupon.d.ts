import { z } from "zod";
/** Basic coupon definition */
export declare const couponSchema: z.ZodObject<{
    /** Case-insensitive coupon code */
    code: z.ZodString;
    /** Optional description shown in CMS */
    description: z.ZodOptional<z.ZodString>;
    /** Percentage discount to apply (0–100) */
    discountPercent: z.ZodNumber;
    /** ISO date when the coupon becomes valid */
    validFrom: z.ZodOptional<z.ZodString>;
    /** ISO date when the coupon expires */
    validTo: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    code: string;
    discountPercent: number;
    description?: string | undefined;
    validFrom?: string | undefined;
    validTo?: string | undefined;
}, {
    code: string;
    discountPercent: number;
    description?: string | undefined;
    validFrom?: string | undefined;
    validTo?: string | undefined;
}>;
export type Coupon = z.infer<typeof couponSchema>;
//# sourceMappingURL=Coupon.d.ts.map