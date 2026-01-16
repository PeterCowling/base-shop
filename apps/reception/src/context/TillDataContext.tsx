// src/context/TillDataContext.tsx

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { useCreditSlipsData } from "../hooks/data/till/useCreditSlipsData";
import useAllFinancialTransactionsData from "../hooks/data/useAllFinancialTransactionsData";
import { useCashCountsData } from "../hooks/data/useCashCountsData";
import type { CreditSlip, Transaction } from "../types/component/Till";
import type { CashCount } from "../types/hooks/data/cashCountData";
import { findOpenShift } from "../utils/shiftUtils";
import { useDebugLogger } from "../hooks/utilities/useDebugLogger";
import { getItalyIsoString } from "../utils/dateUtils";

interface TillDataContextValue {
  cashCounts: CashCount[];
  creditSlips: CreditSlip[];
  transactions: Transaction[];
  isShiftOpen: boolean;
  loading: boolean;
  error: unknown;
}

const TillDataContext = createContext<TillDataContextValue | undefined>(
  undefined
);

interface TillDataProviderProps {
  children: ReactNode;
  /**
   * Optional report date to query transactions for a specific day.
   * When provided, transactions are fetched for the entire day regardless of shift status.
   */
  reportDate?: Date;
  /**
   * Explicit start timestamp for transaction queries. Overrides shift-based start.
   */
  startTimestamp?: string;
  /**
   * Explicit end timestamp for transaction queries.
   */
  endTimestamp?: string;
}

export const TillDataProvider: React.FC<TillDataProviderProps> = ({
  children,
  reportDate,
  startTimestamp,
  endTimestamp,
}) => {
  const {
    cashCounts,
    loading: cashCountsLoading,
    error: cashCountsError,
  } = useCashCountsData();
  const {
    creditSlips,
    loading: creditSlipsLoading,
    error: creditSlipsError,
  } = useCreditSlipsData();
  const filteredCashCounts = useMemo(() => {
    if (reportDate) {
      const day = getItalyIsoString(reportDate).slice(0, 10);
      const startIso = `${day}T00:00:00.000+00:00`;
      const endIso = `${day}T23:59:59.999+00:00`;
      return cashCounts.filter(
        (cc) => cc.timestamp >= startIso && cc.timestamp <= endIso
      );
    }
    return cashCounts;
  }, [cashCounts, reportDate]);
  const openShift = useMemo(
    () => findOpenShift(filteredCashCounts),
    [filteredCashCounts]
  );
  useDebugLogger("TillDataContext openShift", openShift);
  const transactionQuery = useMemo(() => {
    if (reportDate) {
      const day = getItalyIsoString(reportDate).slice(0, 10);
      const startIso = `${day}T00:00:00.000+00:00`;
      const endIso = `${day}T23:59:59.999+00:00`;
      return {
        orderByChild: "timestamp",
        startAt: startIso,
        endAt: endIso,
      } as const;
    }
    if (startTimestamp || endTimestamp) {
      return {
        orderByChild: "timestamp",
        ...(startTimestamp && { startAt: startTimestamp }),
        ...(endTimestamp && { endAt: endTimestamp }),
      } as const;
    }
    if (openShift) {
      return { orderByChild: "timestamp", startAt: openShift.timestamp } as const;
    }
    return { skip: true } as const;
  }, [reportDate, startTimestamp, endTimestamp, openShift]);

  const {
    allFinancialTransactions,
    loading: transactionsLoading,
    error: transactionsError,
  } = useAllFinancialTransactionsData(transactionQuery);

  const transactions = useMemo<Transaction[]>(() => {
    if (!allFinancialTransactions) return [];
    return Object.entries(allFinancialTransactions).map(([txnId, txn]) => ({
      ...txn,
      txnId,
    }));
  }, [allFinancialTransactions]);

  const isShiftOpen = useMemo<boolean>(
    () => Boolean(openShift),
    [openShift]
  );

  const loading = cashCountsLoading || creditSlipsLoading || transactionsLoading;
  const error = cashCountsError || creditSlipsError || transactionsError;

  const value = useMemo<TillDataContextValue>(
    () => ({
      cashCounts: filteredCashCounts,
      creditSlips,
      transactions,
      isShiftOpen,
      loading,
      error,
    }),
    [filteredCashCounts, creditSlips, transactions, isShiftOpen, loading, error]
  );

  return (
    <TillDataContext.Provider value={value}>
      {children}
    </TillDataContext.Provider>
  );
};

export function useTillData(): TillDataContextValue {
  const ctx = useContext(TillDataContext);
  if (!ctx) {
    throw new Error("useTillData must be used within a TillDataProvider");
  }
  return ctx;
}
