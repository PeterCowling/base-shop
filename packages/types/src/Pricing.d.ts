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
    }, "strict", z.ZodTypeAny, {
        minDays: number;
        rate: number;
    }, {
        minDays: number;
        rate: number;
    }>, "many">;
    damageFees: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodLiteral<"deposit">]>>;
    coverage: z.ZodDefault<z.ZodRecord<z.ZodEnum<["scuff", "tear", "lost"]>, z.ZodObject<{
        fee: z.ZodNumber;
        waiver: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        fee: number;
        waiver: number;
    }, {
        fee: number;
        waiver: number;
    }>>>;
}, "strict", z.ZodTypeAny, {
    baseDailyRate: number;
    durationDiscounts: {
        minDays: number;
        rate: number;
    }[];
    damageFees: Record<string, number | "deposit">;
    coverage: Partial<Record<"scuff" | "tear" | "lost", {
        fee: number;
        waiver: number;
    }>>;
}, {
    baseDailyRate: number;
    durationDiscounts: {
        minDays: number;
        rate: number;
    }[];
    damageFees: Record<string, number | "deposit">;
    coverage?: Partial<Record<"scuff" | "tear" | "lost", {
        fee: number;
        waiver: number;
    }>> | undefined;
}>;
export type PricingMatrix = z.infer<typeof pricingSchema>;
//# sourceMappingURL=Pricing.d.ts.map