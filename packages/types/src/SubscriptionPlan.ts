import { z } from "zod";

export const subscriptionPlanSchema = z
  .object({
    id: z.string(),
    price: z.number(),
    itemsIncluded: z.number(),
    swapLimit: z.number(),
    shipmentsPerMonth: z.number(),
    prorateOnChange: z.boolean().default(true),
  })
  .strict();

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
