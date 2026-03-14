import { z } from "zod";

export const EmailProgressDataSchema = z.object({
  occupantId: z.string(),
  bookingRef: z.string(),
  occupantName: z.string(),
  occupantEmail: z.string(),
  currentCode: z.number(),
  hoursElapsed: z.number().nullable(),
  lastActionedBy: z.string().optional(),
  lastActionedAt: z.string().optional(),
});

export type EmailProgressData = z.infer<typeof EmailProgressDataSchema>;
