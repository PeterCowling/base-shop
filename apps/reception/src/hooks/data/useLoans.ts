// File: /src/hooks/data/useLoans.ts
import { useMemo } from "react";

import { useLoanData } from "../../context/LoanDataContext";

/**
 * Enumerates allowed loan items (for clarity).
 */
export type LoanItem =
  | "Umbrella"
  | "Hairdryer"
  | "Steamer"
  | "Padlock"
  | "Keycard"
  | "No_card";

/**
 * Enumerates how deposits can be handled.
 */
export type LoanMethod = "CASH" | "PASSPORT" | "LICENSE" | "ID" | "NO_CARD";

/**
 * Narrowed document types: only these three are allowed in the app/UI.
 */
export type TxType = "Loan" | "Refund" | "No_Card";

/**
 * Represents a single occupant loan transaction.
 */
export interface LoanTransaction {
  count: number;
  createdAt: string;
  depositType: LoanMethod;
  deposit: number;
  item: LoanItem;
  type: TxType;
}

/**
 * Represents occupant loan data, keyed by transaction ID.
 */
export interface OccupantLoanData {
  txns: {
    [transactionId: string]: LoanTransaction;
  };
}

/**
 * The entire "loans" data structure, keyed first by bookingRef, then occupantId.
 *
 * Example:
 * loans: {
 *   "booking_123": {
 *     "occ_abc": {
 *       txns: {
 *         "txn_111": { ...LoanTransaction },
 *         "txn_222": { ...LoanTransaction }
 *       }
 *     },
 *     "occ_xyz": {
 *       txns: { ... }
 *     }
 *   }
 * }
 */
export type Loans = {
  [bookingRef: string]: {
    [occupantId: string]: OccupantLoanData;
  };
};

/**
 * Data Hook (Pure Data Hook): Retrieves the entire "loans" node from Firebase and keeps it in state.
 * The structure in Firebase is expected to match the "Loans" type.
 * We do not mutate anything here, just a read operation.
 */
export default function useLoans() {
  const { loans, loading, error } = useLoanData();

  const memoizedReturn = useMemo(
    () => ({
      loans,
      loading,
      error,
    }),
    [loans, loading, error]
  );

  return memoizedReturn;
}
