import { z } from "zod";

/**
 * Subscription plan definition used by shops to configure
 * available subscription options. Plans map to Stripe prices
 * and control shipment allowances.
 */
export const subscriptionPlanSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Stripe price identifier for billing */
    priceId: z.string(),
    /** Number of shipments included per month */
    shipmentsPerMonth: z.number().int().nonnegative().default(0),
    /** Whether changing to this plan should create prorations */
    prorateOnChange: z.boolean().default(true),
  })
  .strict();

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
