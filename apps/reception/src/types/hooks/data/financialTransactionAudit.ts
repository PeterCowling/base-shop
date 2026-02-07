import { type FinancialTransaction } from "./allFinancialTransaction";

export interface FinancialTransactionAudit {
  sourceTxnId: string;
  createdAt: string;
  createdBy: string;
  createdByUid?: string;
  shiftId?: string;
  reason: string;
  before: FinancialTransaction;
  after: FinancialTransaction;
  correctionTxnIds: string[];
}

export type FinancialTransactionAudits = Record<string, FinancialTransactionAudit>;
