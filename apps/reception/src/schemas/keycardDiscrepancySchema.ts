import { z } from "zod";

export const keycardDiscrepancySchema = z.object({
  user: z.string(),
  timestamp: z.string(),
  amount: z.number(),
});

export const keycardDiscrepanciesSchema = z.record(keycardDiscrepancySchema);

export type KeycardDiscrepancy = z.infer<typeof keycardDiscrepancySchema>;
export type KeycardDiscrepancies = z.infer<typeof keycardDiscrepanciesSchema>;
