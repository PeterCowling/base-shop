import { z } from "zod";

export const trackingEventSchema = z
  .object({
    type: z.enum(["shipping", "return"]),
    status: z.string(),
    date: z.string(),
  })
  .strict();

export type TrackingEvent = z.infer<typeof trackingEventSchema>;
