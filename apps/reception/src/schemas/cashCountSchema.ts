import { z } from "zod";

export const cashCountSchema = z.object({
  user: z.string(),
  timestamp: z.string(),
  type: z.enum([
    "opening",
    "close",
    "reconcile",
    "float",
    "tenderRemoval",
  ]),
  count: z.number().optional(),
  difference: z.number().optional(),
  denomBreakdown: z.record(z.number()).optional(),
  keycardCount: z.number().optional(),
  amount: z.number().optional(),
  shiftId: z.string().optional(),
});

export const cashCountsSchema = z.record(cashCountSchema);

export type CashCount = z.infer<typeof cashCountSchema>;
export type CashCounts = z.infer<typeof cashCountsSchema>;
