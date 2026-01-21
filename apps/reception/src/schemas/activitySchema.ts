import { z } from "zod";

export const activitySchema = z.object({
  code: z.number(),
  timestamp: z.string().optional(),
  who: z.string(),
});

export type Activity = z.infer<typeof activitySchema>;
