import { z } from "zod";

export const reverseLogisticsEventSchema = z
  .object({
    sessionId: z.string(),
    event: z.enum(["received", "cleaned", "qaPassed"]),
    at: z.string(),
  })
  .strict();

export type ReverseLogisticsEvent = z.infer<typeof reverseLogisticsEventSchema>;
