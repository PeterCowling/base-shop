/* File: src/hooks/orchestrations/allTransactions/useAllTransactionsList.ts */

import { useMemo } from "react";

import { type FinancialTransaction } from "../../../types/hooks/data/allFinancialTransaction";
import useFirebaseSubscription from "../../data/useFirebaseSubscription";

/**
 * Returns a typed list of transactions from /allTransactions in real time.
 */
export default function useAllTransactionsList() {
  const { data, loading, error } =
    useFirebaseSubscription<Record<string, FinancialTransaction>>(
      "allTransactions"
    );

  const transactions = useMemo(
    () =>
      data
        ? Object.entries(data).map(([txnId, txn]) => ({ ...txn, txnId }))
        : [],
    [data]
  );

  return { transactions, loading, error };
}
