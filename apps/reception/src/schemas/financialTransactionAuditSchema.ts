import { z } from "zod";

import { financialTransactionSchema } from "./financialTransactionSchema";

export const financialTransactionAuditSchema = z.object({
  sourceTxnId: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  createdByUid: z.string().optional(),
  shiftId: z.string().optional(),
  reason: z.string(),
  before: financialTransactionSchema,
  after: financialTransactionSchema,
  correctionTxnIds: z.array(z.string()),
});

export type FinancialTransactionAudit = z.infer<
  typeof financialTransactionAuditSchema
>;

export const financialTransactionAuditsSchema = z.record(
  financialTransactionAuditSchema
);

export type FinancialTransactionAudits = z.infer<
  typeof financialTransactionAuditsSchema
>;
