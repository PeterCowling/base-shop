// /src/types/financialsRoom.ts
/**
 * Defines the TypeScript types for the "financialsRoom" node in Firebase.
 *
 * Structure:
 * "financialsRoom": {
 *   "<booking_reference>": {
 *     "balance": <number>,
 *     "totalDue": <number>,
 *     "totalPaid": <number>,
 *     "transactions": {
 *       "<transaction_id>": {
 *         "amount": <number>,
 *         "nonRefundable": <boolean>,
 *         "timestamp": "<ISO 8601 string>",
 *         "type": "<string>"
 *       }
 *     }
 *   }
 * }
 */

export interface FinancialsTransaction {
  amount: number;
  nonRefundable: boolean;
  timestamp: string; // ISO 8601, e.g. "2024-02-19T08:00:00.000Z"
  type: string; // e.g. "charge", "payment"
}

export interface FinancialsTransactions {
  [transactionId: string]: FinancialsTransaction;
}

/**
 * Structure for a single booking's financial data.
 */
export interface FinancialsRoomRecord {
  balance: number;
  totalDue: number;
  totalPaid: number;
  transactions?: FinancialsTransactions;
}

/**
 * The overall "financialsRoom" object, keyed by booking reference.
 */
export interface FinancialsRoom {
  [bookingReference: string]: FinancialsRoomRecord;
}
