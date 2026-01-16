import { get, ref, remove, update } from "firebase/database";
import { useCallback, useState } from "react";

import useActivitiesMutations from "./useActivitiesMutations";
import useAllTransactions from "./useAllTransactionsMutations";
import { useAuth } from "../../context/AuthContext";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { LoanMethod, LoanTransaction } from "../../types/hooks/data/loansData";
import { generateTransactionId } from "../../utils/generateTransactionId";

/**
 * Mutation Hook:
 * Provides methods for creating/updating/removing loan records in Firebase,
 * always using the path: loans/<bookingRef>/<occupantId>/txns/<transactionId>.
 *
 * Note: No try/catch blocks. We rely on .then(...).catch(...).
 */
export default function useLoansMutations() {
  const database = useFirebaseDatabase();
  const [error, setError] = useState<unknown>(null);

  // We need the user’s info for logging deposit refunds and adding an activity.
  // Renamed 'user' to '_user' to satisfy lint rules for unused vars.
  const { user: _user } = useAuth();

  // Hooks for logging activities and financial transactions
  const { logActivity } = useActivitiesMutations();
  const { addToAllTransactions } = useAllTransactions();

  /**
   * Save or update a single transaction:
   *   loans/<bookingRef>/<occupantId>/txns/<transactionId>
   */
  const saveLoan = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      transactionId: string,
      loanData: LoanTransaction
    ) => {
      setError(null);
      const path = `loans/${bookingRef}/${occupantId}/txns/${transactionId}`;
      const loanRef = ref(database, path);

      return update(loanRef, loanData)
        .then(() => {
          console.log("Saved loan transaction:", path, loanData);
        })
        .catch((err) => {
          console.error("Error saving loan transaction:", path, err);
          setError(err);
          throw err;
        });
    },
    [database]
  );

  /**
   * Removes the occupant node entirely if it has zero transactions left:
   *   loans/<bookingRef>/<occupantId>/txns => remove occupant if empty
   */
  const removeOccupantIfEmpty = useCallback(
    (bookingRef: string, occupantId: string) => {
      setError(null);
      const occupantTxnsRef = ref(
        database,
        `loans/${bookingRef}/${occupantId}/txns`
      );

      return get(occupantTxnsRef)
        .then((snapshot) => {
          if (!snapshot.exists() || snapshot.size === 0) {
            const occupantRef = ref(
              database,
              `loans/${bookingRef}/${occupantId}`
            );
            return remove(occupantRef).then(() => {
              console.log(
                "Removed empty occupant node:",
                bookingRef,
                occupantId
              );
            });
          }
          return null;
        })
        .catch((err) => {
          console.error(
            "Error checking occupant transactions:",
            bookingRef,
            occupantId,
            err
          );
          setError(err);
          throw err;
        });
    },
    [database]
  );

  /**
   * Removes any existing "Loan" transactions (type === "Loan") for the given item,
   * then calls removeOccupantIfEmpty to clean up if no remaining txns.
   */
  const removeLoanTransactionsForItem = useCallback(
    (bookingRef: string, occupantId: string, itemName: string) => {
      setError(null);
      const occupantTxnsRef = ref(
        database,
        `loans/${bookingRef}/${occupantId}/txns`
      );

      return get(occupantTxnsRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            snapshot.forEach((txnSnap) => {
              const txn = txnSnap.val() as LoanTransaction;
              if (txn.item === itemName && txn.type === "Loan") {
                const txnPath = `loans/${bookingRef}/${occupantId}/txns/${txnSnap.key}`;
                remove(ref(database, txnPath))
                  .then(() => {
                    console.log("Removed Loan transaction:", txnPath);
                  })
                  .catch((err) => {
                    console.error("Error removing transaction:", txnPath, err);
                    setError(err);
                    throw err;
                  });
              }
            });
          }
        })
        .then(() => {
          // After removing matching "Loan" transactions, check occupant emptiness
          return removeOccupantIfEmpty(bookingRef, occupantId);
        })
        .catch((err) => {
          console.error(
            "Error removing loan transactions for item:",
            itemName,
            err
          );
          setError(err);
          throw err;
        });
    },
    [database, removeOccupantIfEmpty]
  );

  /**
   * Directly remove a specific transaction by occupant + transaction ID,
   * then remove occupant if empty. If the item is "Keycard", log an activity (#13)
   * and create a keycard deposit refund entry in allFinancialTransactions.
   */
  const removeLoanItem = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      transactionId: string,
      itemName: string
    ) => {
      setError(null);

      const path = `loans/${bookingRef}/${occupantId}/txns/${transactionId}`;
      const txnRef = ref(database, path);

      let originalDeposit = 0;
      let _originalMethod: LoanMethod | undefined;

      // Read the transaction first so we know how much to refund
      return get(txnRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const txn = snapshot.val() as LoanTransaction;
            originalDeposit = txn.deposit || 0;
            _originalMethod = txn.depositType;
          }
        })
        .then(() => remove(txnRef))
        .then(() => {
          console.log("Removed occupant transaction:", path);

          if (itemName === "Keycard") {
            return logActivity(occupantId, 13)
              .then(() => {
                if (originalDeposit > 0) {
                  const transactionKey = `${generateTransactionId()}`;
                  return addToAllTransactions(transactionKey, {
                    bookingRef,
                    occupantId,
                    amount: -originalDeposit,
                    count: 1,
                    description: "Keycard deposit refund",
                    method: "cash",
                    type: "deposit",
                    isKeycard: true,
                    itemCategory: "KeycardDepositRefund",
                  });
                }
                return null;
              })
              .catch((err) => {
                console.error("Keycard activity/refund error:", err);
                setError(err);
                throw err;
              });
          }

          return null;
        })
        .then(() => {
          // After removing the transaction (and potentially logging Keycard activity),
          // check if occupant has any transactions left
          return removeOccupantIfEmpty(bookingRef, occupantId);
        })
        .catch((err) => {
          console.error("Error removing occupant transaction:", path, err);
          setError(err);
          throw err;
        });
    },
    [database, removeOccupantIfEmpty, logActivity, addToAllTransactions]
  );

  /**
   * Convert a keycard loan that was left as a document deposit into a cash deposit.
   * Updates the loan record and logs a corresponding financial transaction and activity.
   */
  const convertKeycardDocToCash = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      transactionId: string,
      count: number
    ) => {
      setError(null);

      const deposit = 10 * count;
      const path = `loans/${bookingRef}/${occupantId}/txns/${transactionId}`;
      const loanRef = ref(database, path);

      return update(loanRef, { depositType: "CASH" as LoanMethod, deposit })
        .then(() => {
          const txnKey = generateTransactionId();
          return addToAllTransactions(txnKey, {
            bookingRef,
            occupantId,
            amount: deposit,
            count,
            description: "Keycard deposit",
            method: "cash",
            type: "deposit",
            isKeycard: true,
            itemCategory: "KeycardDeposit",
          });
        })
        .then(() => logActivity(occupantId, 10))
        .catch((err) => {
          console.error("Error converting document deposit to cash:", err);
          setError(err);
          throw err;
        });
    },
    [database, addToAllTransactions, logActivity]
  );

  /**
   * Update the deposit type for a specific loan transaction.
   */
  const updateLoanDepositType = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      transactionId: string,
      depositType: LoanMethod
    ) => {
      setError(null);
      const path = `loans/${bookingRef}/${occupantId}/txns/${transactionId}`;
      const loanRef = ref(database, path);

      return get(loanRef)
        .then((snapshot) => {
          if (!snapshot.exists()) return null;
          const txn = snapshot.val() as LoanTransaction;
          const newDeposit = depositType === "CASH" ? 10 * txn.count : 0;
          return update(loanRef, { depositType, deposit: newDeposit });
        })
        .then(() => {
          console.log("Updated deposit type:", path, depositType);
        })
        .catch((err) => {
          console.error("Error updating deposit type:", path, err);
          setError(err);
          throw err;
        });
    },
    [database]
  );

  return {
    saveLoan,
    removeLoanItem,
    removeLoanTransactionsForItem,
    updateLoanDepositType,
    convertKeycardDocToCash,
    removeOccupantIfEmpty,
    error,
  };
}
