import { z } from "zod";
export declare const couponSchema: z.ZodObject<{
    code: z.ZodString;
    percentOff: z.ZodOptional<z.ZodNumber>;
    amountOff: z.ZodOptional<z.ZodNumber>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    percentOff?: number | undefined;
    amountOff?: number | undefined;
    expiresAt?: string | undefined;
}, {
    code: string;
    percentOff?: number | undefined;
    amountOff?: number | undefined;
    expiresAt?: string | undefined;
}>;
export type Coupon = z.infer<typeof couponSchema>;
//# sourceMappingURL=Coupon.d.ts.map
