/* src/schemas/eodClosureSchema.ts */

import { z } from "zod";

export const eodClosureSchema = z.object({
  date: z.string(),
  timestamp: z.string(),
  confirmedBy: z.string(),
  uid: z.string().optional(),
});

export type EodClosure = z.infer<typeof eodClosureSchema>;
