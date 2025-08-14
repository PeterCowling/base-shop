import { z } from "zod";

/** Definition for a subscription plan available in a shop. */
export const subscriptionPlanSchema = z
  .object({
    /** Unique identifier for the plan */
    id: z.string(),
    /** Human readable name */
    name: z.string(),
    /** Stripe price identifier associated with this plan */
    priceId: z.string(),
    /** Number of shipments allowed per month */
    shipmentsPerMonth: z.number().int().nonnegative().default(0),
    /** Whether plan changes should be prorated by Stripe */
    prorateOnChange: z.boolean().default(true),
  })
  .strict();

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
