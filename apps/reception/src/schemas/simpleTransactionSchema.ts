import { z } from "zod";

export const simpleTransactionSchema = z.object({
  item: z.string(),
  deposit: z.number(),
  count: z.number(),
  method: z.string().optional(),
  type: z.string().optional(),
});

export const simpleTransactionsSchema = z.record(simpleTransactionSchema);

export type SimpleTransaction = z.infer<typeof simpleTransactionSchema>;
export type SimpleTransactions = z.infer<typeof simpleTransactionsSchema>;
