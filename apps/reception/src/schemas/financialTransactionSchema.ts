import { z } from "zod";

export const financialTransactionSchema = z.object({
  amount: z.number(),
  bookingRef: z.string(),
  count: z.number(),
  description: z.string(),
  itemCategory: z.string(),
  method: z.string(),
  occupantId: z.string(),
  timestamp: z.string(),
  type: z.string(),
  user_name: z.string(),
  nonRefundable: z.boolean().optional(),
  docType: z.string().optional(),
  isKeycard: z.boolean().optional(),
});

export type FinancialTransaction = z.infer<typeof financialTransactionSchema>;

export const allFinancialTransactionsSchema = z.record(
  financialTransactionSchema
);

export type AllFinancialTransactions = z.infer<
  typeof allFinancialTransactionsSchema
>;
