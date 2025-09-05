import { z } from "zod";

export const reverseLogisticsEventNameSchema = z.enum([
  "received",
  "cleaning",
  "repair",
  "qa",
  "available",
]);

export type ReverseLogisticsEventName = z.infer<
  typeof reverseLogisticsEventNameSchema
>;

export const reverseLogisticsEventSchema = z
  .object({
    id: z.string(),
    shop: z.string(),
    sessionId: z.string(),
    event: reverseLogisticsEventNameSchema,
    createdAt: z.string(),
  })
  .strict();

export type ReverseLogisticsEvent = z.infer<
  typeof reverseLogisticsEventSchema
>;

