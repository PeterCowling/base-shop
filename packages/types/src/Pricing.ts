import { z } from "zod";

import { coverageSchema } from "./Coverage";

/**
 * Rental pricing configuration loaded from `data/rental/pricing.json`.
 *
 * - `baseDailyRate` provides the fallback daily price used when a SKU lacks a specific rate.
 * - `durationDiscounts` contains rate multipliers applied when `minDays` is met.
 * - `damageFees` maps damage codes to a fixed amount or the string `"deposit"`.
 */
export const pricingSchema = z
  .object({
    baseDailyRate: z.number(),
    durationDiscounts: z.array(
      z
        .object({
          minDays: z.number(),
          rate: z.number(),
        })
        .strict()
    ),
    damageFees: z.record(z.union([z.number(), z.literal("deposit")])),
    coverage: coverageSchema.default({}),
  })
  .strict();

export type PricingMatrix = z.infer<typeof pricingSchema>;
