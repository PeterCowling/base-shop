// /src/types/loans.ts
/**
 * Type definitions for the "loans" node in Firebase.
 *
 * Structure example:
 * "loans": {
 *   "<occupant_id>": {
 *     "txns": {
 *       "<transaction_id>": {
 *         "count": <number>,
 *         "createdAt": "<ISO 8601 string>",
 *         "deposit": <number>,
 *         "depositType": "<string>",
 *         "item": "<string>",
 *         "type": "<string>"
 *       }
 *     }
 *   }
 * }
 */

import { type IndexedById } from './indexedById';

/**
 * TxType: enumerates possible transaction types.
 * If you have more, add them here.
 */
export type TxType = 'loan' | 'refund' | 'no_card';

/**
 * LoanTransaction
 * - Represents a single deposit-based transaction for an occupant.
 * - `count` is how many items were loaned/refunded,
 * - `createdAt` is an ISO timestamp (string),
 * - `deposit` is a positive or negative number,
 * - `depositType` is how the deposit was handled (e.g. "CASH", "CARD", etc.),
 * - `item` is the borrowed or returned item name (e.g. "hairdryer"),
 * - `type` is the transaction type (loan/refund/no_card).
 */
export interface LoanTransaction {
  count: number;
  createdAt: string; // ISO 8601, e.g. "2025-03-02T07:44:56.267Z"
  deposit: number;
  depositType: string; // e.g. "CASH", "CARD", "UNKNOWN"
  item: string; // e.g. "hairdryer"
  type: TxType;
}

/**
 * LoanOccupantRecord
 * - The occupant's record contains a "txns" object, keyed by a unique transaction ID.
 */
export interface LoanOccupantRecord {
  txns: {
    [transactionId: string]: LoanTransaction;
  };
}

/**
 * Loans
 * - The entire "loans" node, keyed by occupant_id, which then contains the occupant's record.
 */
export type Loans = IndexedById<LoanOccupantRecord>;
