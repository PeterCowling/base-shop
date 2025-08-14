import { z } from "zod";

export const subscriptionPlanSchema = z
  .object({
    id: z.string(),
    price: z.number().int().nonnegative(),
    itemsIncluded: z.number().int().nonnegative(),
    swapLimit: z.number().int().nonnegative(),
    shipmentCount: z.number().int().nonnegative(),
  })
  .strict();

export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
