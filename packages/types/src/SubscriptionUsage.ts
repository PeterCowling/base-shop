import { z } from "zod";

export const subscriptionUsageSchema = z
  .object({
    id: z.string(),
    shop: z.string(),
    customerId: z.string(),
    month: z.string(),
    shipments: z.number(),
  })
  .strict();

export type SubscriptionUsage = z.infer<typeof subscriptionUsageSchema>;

