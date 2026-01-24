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
  shiftId: z.string().optional(),
  sourceTxnId: z.string().optional(),
  correctionReason: z.string().optional(),
  correctionKind: z.string().optional(),
  correctedBy: z.string().optional(),
  correctedByUid: z.string().optional(),
  correctedShiftId: z.string().optional(),
  voidedAt: z.string().optional(),
  voidedBy: z.string().optional(),
  voidedByUid: z.string().optional(),
  voidReason: z.string().optional(),
  voidedShiftId: z.string().optional(),
});

export type FinancialTransaction = z.infer<typeof financialTransactionSchema>;

export const allFinancialTransactionsSchema = z.record(
  financialTransactionSchema
);

export type AllFinancialTransactions = z.infer<
  typeof allFinancialTransactionsSchema
>;
