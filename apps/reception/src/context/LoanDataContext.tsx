import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import useFirebaseSubscription from "../hooks/data/useFirebaseSubscription";
import useLoansMutations from "../hooks/mutations/useLoansMutations";
import { loansSchema,loanTransactionSchema } from "../schemas/loansSchema";
import {
  type LoanMethod,
  type Loans,
  type LoanTransaction,
} from "../types/hooks/data/loansData";
import { showToast } from "../utils/toastUtils";

interface LoanDataContextValue {
  loans: Loans | null;
  loading: boolean;
  error: unknown;
  saveLoan: (
    bookingRef: string,
    occupantId: string,
    txnId: string,
    loanData: LoanTransaction
  ) => Promise<void>;
  removeLoanItem: (
    bookingRef: string,
    occupantId: string,
    txnId: string,
    itemName: string,
    depositType?: LoanMethod | string
  ) => Promise<void | null>;
  removeLoanTransactionsForItem: (
    bookingRef: string,
    occupantId: string,
    itemName: string
  ) => Promise<void | null>;
  updateLoanDepositType: (
    bookingRef: string,
    occupantId: string,
    txnId: string,
    depositType: LoanMethod
  ) => Promise<void | null>;
  convertKeycardDocToCash: (
    bookingRef: string,
    occupantId: string,
    txnId: string,
    count: number
  ) => Promise<void | null>;
  removeOccupantIfEmpty: (
    bookingRef: string,
    occupantId: string
  ) => Promise<void | null>;
  mutationError: unknown;
}

const LoanDataContext = createContext<LoanDataContextValue | undefined>(
  undefined
);

export const LoanDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Loans>("loans");
  const [loansState, setLoansState] = useState<Loans | null>(null);
  const [error, setError] = useState<unknown>(subError);

  // keep local state in sync with firebase subscription
  useEffect(() => {
    if (subError) {
      setError(subError);
      return;
    }
    if (!data) {
      setLoansState(null);
      return;
    }
    const result = loansSchema.safeParse(data);
    if (result.success) {
      setLoansState(result.data);
      setError(null);
    } else {
      setLoansState(null);
      setError(result.error);
    }
  }, [data, subError]);

  const {
    saveLoan,
    removeLoanItem,
    removeLoanTransactionsForItem,
    updateLoanDepositType,
    convertKeycardDocToCash,
    removeOccupantIfEmpty,
    error: mutationError,
  } = useLoansMutations();

  const saveLoanAndUpdate = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      txnId: string,
      loanData: LoanTransaction
    ) => {
      const result = loanTransactionSchema.safeParse(loanData);
      if (!result.success) {
        showToast("Invalid loan transaction", "error");
        return Promise.reject(result.error);
      }
      return saveLoan(bookingRef, occupantId, txnId, result.data)
        .then(() => {
          setLoansState((prev) => {
            const next: Loans = { ...(prev || {}) };
            const booking = next[bookingRef] || {};
            const occupant = booking[occupantId] || { txns: {} };
            occupant.txns = { ...occupant.txns, [txnId]: result.data };
            next[bookingRef] = { ...booking, [occupantId]: occupant };
            return next;
          });
        })
        .catch((err) => {
          showToast("Failed to save loan", "error");
          throw err;
        });
    },
    [saveLoan]
  );

  const removeLoanItemAndUpdate = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      txnId: string,
      itemName: string,
      _depositType?: LoanMethod | string
    ) =>
      removeLoanItem(bookingRef, occupantId, txnId, itemName)
        .then(() => {
          setLoansState((prev) => {
            if (!prev) return prev;
            const next: Loans = { ...prev };
            const booking = next[bookingRef];
            const occupant = booking?.[occupantId];
            if (!booking || !occupant) return prev;
            const newTxns = { ...occupant.txns };
            delete newTxns[txnId];
            if (Object.keys(newTxns).length === 0) {
              const newBooking = { ...booking };
              delete newBooking[occupantId];
              if (Object.keys(newBooking).length === 0) {
                delete next[bookingRef];
              } else {
                next[bookingRef] = newBooking;
              }
            } else {
              next[bookingRef] = {
                ...booking,
                [occupantId]: { txns: newTxns },
              };
            }
            return next;
          });
        })
        .catch((err) => {
          showToast("Failed to remove loan item", "error");
          throw err;
        }),
    [removeLoanItem]
  );

  const removeLoanTransactionsForItemAndUpdate = useCallback(
    (bookingRef: string, occupantId: string, itemName: string) =>
      removeLoanTransactionsForItem(bookingRef, occupantId, itemName)
        .then(() => {
          setLoansState((prev) => {
            if (!prev) return prev;
            const next: Loans = { ...prev };
            const booking = next[bookingRef];
            const occupant = booking?.[occupantId];
            if (!booking || !occupant) return prev;
            const newTxns = { ...occupant.txns };
            Object.entries(newTxns).forEach(([id, txn]) => {
              if (
                (txn as LoanTransaction).item === itemName &&
                (txn as LoanTransaction).type === "Loan"
              ) {
                delete newTxns[id];
              }
            });
            if (Object.keys(newTxns).length === 0) {
              const newBooking = { ...booking };
              delete newBooking[occupantId];
              if (Object.keys(newBooking).length === 0) {
                delete next[bookingRef];
              } else {
                next[bookingRef] = newBooking;
              }
            } else {
              next[bookingRef] = {
                ...booking,
                [occupantId]: { txns: newTxns },
              };
            }
            return next;
          });
        })
        .catch((err) => {
          showToast("Failed to remove loan records", "error");
          throw err;
        }),
    [removeLoanTransactionsForItem]
  );

  const updateLoanDepositTypeAndUpdate = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      txnId: string,
      depositType: LoanMethod
    ) =>
      updateLoanDepositType(bookingRef, occupantId, txnId, depositType)
        .then(() => {
          setLoansState((prev) => {
            if (!prev) return prev;
            const next: Loans = { ...prev };
            const txn = next[bookingRef]?.[occupantId]?.txns?.[txnId];
            if (txn) {
              const newDeposit =
                depositType === "CASH"
                  ? 10 * (txn as LoanTransaction).count
                  : 0;
              next[bookingRef][occupantId].txns[txnId] = {
                ...(txn as LoanTransaction),
                depositType,
                deposit: newDeposit,
              };
            }
            return next;
          });
        })
        .catch((err) => {
          showToast("Failed to update deposit type", "error");
          throw err;
        }),
    [updateLoanDepositType]
  );

  const convertKeycardDocToCashAndUpdate = useCallback(
    (bookingRef: string, occupantId: string, txnId: string, count: number) =>
      convertKeycardDocToCash(bookingRef, occupantId, txnId, count)
        .then(() => {
          setLoansState((prev) => {
            if (!prev) return prev;
            const next: Loans = { ...prev };
            const txn = next[bookingRef]?.[occupantId]?.txns?.[txnId];
            if (txn) {
              next[bookingRef][occupantId].txns[txnId] = {
                ...(txn as LoanTransaction),
                depositType: "CASH",
                deposit: 10 * count,
              };
            }
            return next;
          });
        })
        .catch((err) => {
          showToast("Failed to update keycard state", "error");
          throw err;
        }),
    [convertKeycardDocToCash]
  );

  const removeOccupantIfEmptyAndUpdate = useCallback(
    (bookingRef: string, occupantId: string) =>
      removeOccupantIfEmpty(bookingRef, occupantId)
        .then(() => {
          setLoansState((prev) => {
            if (!prev) return prev;
            const next: Loans = { ...prev };
            const booking = next[bookingRef];
            const occupant = booking?.[occupantId];
            if (!booking || !occupant) return prev;
            if (!occupant.txns || Object.keys(occupant.txns).length === 0) {
              const newBooking = { ...booking };
              delete newBooking[occupantId];
              if (Object.keys(newBooking).length === 0) {
                delete next[bookingRef];
              } else {
                next[bookingRef] = newBooking;
              }
            }
            return next;
          });
        })
        .catch((err) => {
          showToast("Failed to update loan data", "error");
          throw err;
        }),
    [removeOccupantIfEmpty]
  );

  const value = useMemo(
    () => ({
      loans: loansState,
      loading,
      error,
      saveLoan: saveLoanAndUpdate,
      removeLoanItem: removeLoanItemAndUpdate,
      removeLoanTransactionsForItem: removeLoanTransactionsForItemAndUpdate,
      updateLoanDepositType: updateLoanDepositTypeAndUpdate,
      convertKeycardDocToCash: convertKeycardDocToCashAndUpdate,
      removeOccupantIfEmpty: removeOccupantIfEmptyAndUpdate,
      mutationError,
    }),
    [
      loansState,
      loading,
      error,
      saveLoanAndUpdate,
      removeLoanItemAndUpdate,
      removeLoanTransactionsForItemAndUpdate,
      updateLoanDepositTypeAndUpdate,
      convertKeycardDocToCashAndUpdate,
      removeOccupantIfEmptyAndUpdate,
      mutationError,
    ]
  );

  return (
    <LoanDataContext.Provider value={value}>
      {children}
    </LoanDataContext.Provider>
  );
};

export function useLoanData(): LoanDataContextValue {
  const ctx = useContext(LoanDataContext);
  if (!ctx) {
    throw new Error("useLoanData must be used within a LoanDataProvider");
  }
  return ctx;
}
