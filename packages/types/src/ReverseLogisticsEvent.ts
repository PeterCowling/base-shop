import { z } from "zod";

export const reverseLogisticsEventSchema = z
  .object({
    id: z.string(),
    shop: z.string(),
    sessionId: z.string(),
    event: z.enum(["received", "cleaned", "qaPassed"]),
    at: z.string(),
  })
  .strict();

export type ReverseLogisticsEvent = z.infer<typeof reverseLogisticsEventSchema>;
