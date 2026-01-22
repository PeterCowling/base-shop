// File: /src/hooks/data/useAllFinancialTransactionsData.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByChild,
  query,
  ref,
  startAt,
} from "firebase/database";

import { financialTransactionSchema } from "../../schemas/financialTransactionSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  type AllFinancialTransactions,
  type FinancialTransaction,
} from "../../types/hooks/data/allFinancialTransaction";
/**
 * A pure data hook that reads the full /allFinancialTransactions node.
 *
 * Returns an object with:
 *  - allFinancialTransactions: the retrieved transaction records,
 *  - loading: a boolean indicating if the data is still being fetched,
 *  - error: any error encountered during data retrieval.
 *
 * This hook does not perform mutations; it simply listens for changes
 * and updates local state accordingly.
 */
export interface UseAllFinancialTransactionsParams {
  amount?: string;
  itemCategory?: string;
  userName?: string;
  skip?: boolean;
  orderByChild?: string;
  startAt?: string | number;
  endAt?: string | number;
  limitToFirst?: number;
}

export default function useAllFinancialTransactionsData({
  amount = "",
  itemCategory = "",
  userName = "",
  skip = false,
  orderByChild: orderChild,
  startAt: startVal,
  endAt: endVal,
  limitToFirst: limit,
}: UseAllFinancialTransactionsParams = {}) {
  const database = useFirebaseDatabase();

  // Local state for the transactions, loading status, and errors.
  const [allFinancialTransactions, setAllFinancialTransactions] =
    useState<AllFinancialTransactions>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  /**
   * Handles data updates from Firebase.
   * If data exists, set it; otherwise, set an empty object.
   */
  const handleDataChange = useCallback((snapshot: DataSnapshot) => {
    try {
      if (snapshot.exists()) {
        const raw = snapshot.val() as Record<string, unknown>;
        const valid: Record<string, FinancialTransaction> = {};
        const errs: unknown[] = [];

        for (const [key, value] of Object.entries(raw)) {
          const parsed = financialTransactionSchema.safeParse(value);
          if (parsed.success) {
            valid[key] = parsed.data as FinancialTransaction;
          } else {
            errs.push(parsed.error);
          }
        }

        setAllFinancialTransactions(valid);
        setError(errs.length > 0 ? errs : null);
      } else {
        setAllFinancialTransactions({});
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handles errors encountered during data fetching.
   */
  const handleError = useCallback((err: unknown) => {
    setError(err);
    setLoading(false);
    console.error(
      "[useAllFinancialTransactionsData] Error fetching data:",
      err
    );
  }, []);

  /**
   * Subscribe to the /allFinancialTransactions node on mount.
   * Clean up the listener on unmount.
   */
  useEffect(() => {
    if (skip || !database) {
      setAllFinancialTransactions({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const transactionsRef = ref(database, "allFinancialTransactions");
    let q = query(transactionsRef);
    if (orderChild) q = query(q, orderByChild(orderChild));
    if (startVal !== undefined) q = query(q, startAt(startVal));
    if (endVal !== undefined) q = query(q, endAt(endVal));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const unsubscribe = onValue(q, handleDataChange, handleError);
    return unsubscribe;
  }, [
    database,
    handleDataChange,
    handleError,
    skip,
    orderChild,
    startVal,
    endVal,
    limit,
  ]);
  /**
   * Memoize the transactions data to optimize performance.
   */
  const filteredTransactions = useMemo(() => {
    if (!allFinancialTransactions)
      return [] as [string, FinancialTransaction][];

    return Object.entries(allFinancialTransactions).filter(([_, txn]) => {
      if (amount && txn.amount !== Number(amount)) return false;
      if (
        itemCategory &&
        !txn.itemCategory.toLowerCase().includes(itemCategory.toLowerCase())
      )
        return false;
      if (
        userName &&
        !txn.user_name.toLowerCase().includes(userName.toLowerCase())
      )
        return false;
      return true;
    });
  }, [allFinancialTransactions, amount, itemCategory, userName]);

  return {
    allFinancialTransactions,
    filteredTransactions,
    loading,
    error,
  };
}
