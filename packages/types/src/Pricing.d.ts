import { z } from "zod";
/**
 * Rental pricing configuration loaded from `data/rental/pricing.json`.
 *
 * - `baseDailyRate` provides the fallback daily price used when a SKU lacks a specific rate.
 * - `durationDiscounts` contains rate multipliers applied when `minDays` is met.
 * - `damageFees` maps damage codes to a fixed amount or the string `"deposit"`.
 */
export declare const pricingSchema: z.ZodObject<{
    baseDailyRate: z.ZodNumber;
    durationDiscounts: z.ZodArray<z.ZodObject<{
        minDays: z.ZodNumber;
        rate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        minDays: number;
        rate: number;
    }, {
        minDays: number;
        rate: number;
    }>, "many">;
    damageFees: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodLiteral<"deposit">]>>;
}, "strip", z.ZodTypeAny, {
    baseDailyRate: number;
    durationDiscounts: {
        minDays: number;
        rate: number;
    }[];
    damageFees: Record<string, number | "deposit">;
}, {
    baseDailyRate: number;
    durationDiscounts: {
        minDays: number;
        rate: number;
    }[];
    damageFees: Record<string, number | "deposit">;
}>;
export type PricingMatrix = z.infer<typeof pricingSchema>;
//# sourceMappingURL=Pricing.d.ts.map