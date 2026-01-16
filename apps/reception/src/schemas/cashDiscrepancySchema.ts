import { z } from "zod";

export const cashDiscrepancySchema = z.object({
  user: z.string(),
  timestamp: z.string(),
  amount: z.number(),
});

export const cashDiscrepanciesSchema = z.record(cashDiscrepancySchema);

export type CashDiscrepancy = z.infer<typeof cashDiscrepancySchema>;
export type CashDiscrepancies = z.infer<typeof cashDiscrepanciesSchema>;
