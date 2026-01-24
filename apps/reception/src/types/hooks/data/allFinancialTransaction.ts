// src/types/hooks/data/allFinancialTransactions.ts

/**
 * Represents a single financial transaction record within `/allFinancialTransactions`.
 *
 * Example:
 *   "txn_20250305174029242-0": {
 *     amount: 12.5,
 *     bookingRef: "1",
 *     count: 1,
 *     description: "PC Orange Syrup",
 *     itemCategory: "Other",
 *     method: "card",
 *     occupantId: "Pete",
 *     timestamp: "2025-05-03T17:40:29.000+02:00",
 *     type: "barSale",
 *     user_name: "Pete",
 *     nonRefundable?: true,
 *     docType?: "receipt",
 *     isKeycard?: true
  *   }
 */
export interface FinancialTransaction {
  amount: number;
  bookingRef: string;
  count: number;
  description: string;
  itemCategory: string;
  method: string;
  occupantId: string;
  timestamp: string;
  type: string;
  user_name: string;
  nonRefundable?: boolean;
  docType?: string;
  /** Indicates that this transaction relates to a keycard. */
  isKeycard?: boolean;
  /** Associates the transaction with a till shift. */
  shiftId?: string;
  /** Correction metadata. */
  sourceTxnId?: string;
  correctionReason?: string;
  correctionKind?: "reversal" | "replacement" | "adjustment";
  correctedBy?: string;
  correctedByUid?: string;
  correctedShiftId?: string;
  /** Void metadata. */
  voidedAt?: string;
  voidedBy?: string;
  voidedByUid?: string;
  voidReason?: string;
  voidedShiftId?: string;
}

/**
 * The entire "allFinancialTransactions" node represented as a map of:
 * transactionId -> FinancialTransaction.
 *
 * Example:
 *   "allFinancialTransactions": {
 *     "txn_20250305174029242-0": {
 *       amount: 12.5,
 *       bookingRef: "1",
 *       count: 1,
 *       description: "PC Orange Syrup",
 *       itemCategory: "Other",
 *       method: "card",
 *       occupantId: "Pete",
 *       timestamp: "2025-05-03T17:40:29.000+02:00",
 *       type: "barSale",
 *       user_name: "Pete"
 *     }
 *   }
 */
export type AllFinancialTransactions = Record<
  string,
  FinancialTransaction
> | null;
