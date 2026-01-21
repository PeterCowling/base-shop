import { get, ref } from "firebase/database";
import { memo, ReactElement, useCallback, useMemo, useState } from "react";
import { useLoanData } from "../../context/LoanDataContext";
import useActivitiesMutations from "../../hooks/mutations/useActivitiesMutations";
import useAllTransactions from "../../hooks/mutations/useAllTransactionsMutations";
import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  LoanItem,
  LoanMethod,
  LoanTransaction,
} from "../../types/hooks/data/loansData";
import { getItalyIsoString, getLocalToday } from "../../utils/dateUtils";
import { generateTransactionId } from "../../utils/generateTransactionId";
import { showToast } from "../../utils/toastUtils";
import { LoanFilters } from "./LoanFilters";
import { LoansTable } from "./LoansTable";
import { getDepositForItem } from "./LoanUtils";
import { useGuestLoanData } from "./useGuestLoanData";
function LoansContainer({ username }: { username: string }): ReactElement {
  const [selectedDate, setSelectedDate] = useState<string>(getLocalToday());
  const [guestFilter, setGuestFilter] = useState("");
  const database = useFirebaseDatabase();
  const { data: guests, loading, error } = useGuestLoanData({ selectedDate });
  const { addActivity } = useActivitiesMutations();
  const { addToAllTransactions } = useAllTransactions();
  const { saveLoan, removeLoanTransactionsForItem } = useLoanData();
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const filteredData = useMemo(() => {
    if (!guests?.length) return [];
    return guests.filter((g) => {
      const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
      return fullName.includes(guestFilter.toLowerCase());
    });
  }, [guests, guestFilter]);
  const handleAddLoanTransaction = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      item: LoanItem,
      depositType: LoanMethod,
      deposit: number,
      count: number
    ) => {
      setButtonDisabled(true);
      const txnId = generateTransactionId();
      const nowIso = getItalyIsoString();
      addActivity(occupantId, deposit);
      addToAllTransactions(txnId, {
        occupantId,
        amount: deposit,
        type: "Loan",
        method: depositType,
        count,
        description: `Added loan for ${item} (Ref: ${bookingRef})`,
        ...(item === "Keycard" ? { isKeycard: true } : {}),
      });
      const newLoanTxn: LoanTransaction = {
        count,
        createdAt: nowIso,
        depositType,
        deposit,
        item,
        type: "Loan",
      };
      saveLoan(bookingRef, occupantId, txnId, newLoanTxn)
        .catch((err) => {
          console.error("Error adding occupant loan transaction:", err);
          showToast("Failed to add loan", "error");
        })
        .finally(() => {
          setButtonDisabled(false);
        });
    },
    [addActivity, addToAllTransactions, saveLoan]
  );
  const getOccupantKeycardCount = useCallback(
    (bookingRef: string, occupantId: string): Promise<number> => {
      if (!database || !occupantId) return Promise.resolve(0);
      const occupantTxnsRef = ref(
        database,
        `loans/${bookingRef}/${occupantId}/txns`
      );
      return get(occupantTxnsRef)
        .then((snapshot) => {
          if (!snapshot.exists()) return 0;
          let totalKeycards = 0;
          snapshot.forEach((txnSnap) => {
            const txn = txnSnap.val() as LoanTransaction;
            if (txn.item === "Keycard") {
              if (txn.type === "Loan") {
                totalKeycards += txn.count;
              } else if (txn.type === "Refund") {
                totalKeycards -= txn.count;
              }
            }
          });
          return totalKeycards;
        })
        .catch((err) => {
          console.error("Error fetching occupant keycard count:", err);
          return 0;
        });
    },
    [database]
  );
  const handleReturnLoanTransaction = useCallback(
    async (
      bookingRef: string,
      occupantId: string,
      item: LoanItem,
      countToRemove: number
    ) => {
      if (!occupantId || !item || countToRemove <= 0) return;
      setButtonDisabled(true);
      if (item === "Keycard") {
        const occupantKeycardCount = await getOccupantKeycardCount(
          bookingRef,
          occupantId
        );
        if (occupantKeycardCount === countToRemove) {
          addActivity(occupantId, 13);
        }
      }
      const txnId = generateTransactionId();
      const nowIso = getItalyIsoString();
      const depositPerItem = getDepositForItem(item);
      const totalRefund = -1 * depositPerItem * countToRemove;
      const depositMethod = depositPerItem === 0 ? "NO_CARD" : "CASH";
      addToAllTransactions(txnId, {
        occupantId,
        amount: totalRefund,
        type: "Refund",
        method: depositMethod,
        count: countToRemove,
        description: `Returned deposit for ${item} (count=${countToRemove}, Ref: ${bookingRef})`,
        ...(item === "Keycard" ? { isKeycard: true } : {}),
      });
      const returnTxn: LoanTransaction = {
        count: countToRemove,
        createdAt: nowIso,
        depositType: depositMethod,
        deposit: totalRefund,
        item,
        type: "Refund",
      };
      saveLoan(bookingRef, occupantId, txnId, returnTxn).catch((err) => {
        console.error("Error saving refund transaction:", err);
        showToast("Failed to save refund", "error");
      });
      removeLoanTransactionsForItem(bookingRef, occupantId, item)
        .catch((err) => {
          console.error("Error removing occupant loan transactions:", err);
          showToast("Failed to update loan records", "error");
        })
        .finally(() => {
          setButtonDisabled(false);
        });
    },
    [
      addActivity,
      addToAllTransactions,
      getOccupantKeycardCount,
      removeLoanTransactionsForItem,
      saveLoan,
    ]
  );
  const onAddLoan = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      itemName: LoanItem,
      count: number,
      depositType?: LoanMethod
    ) => {
      if (!occupantId || !itemName || count <= 0) return;
      const baseDeposit = getDepositForItem(itemName);
      const deposit = depositType === "CASH" ? baseDeposit * count : 0;
      handleAddLoanTransaction(
        bookingRef,
        occupantId,
        itemName,
        depositType || "NO_CARD",
        deposit,
        count
      );
    },
    [handleAddLoanTransaction]
  );
  const onReturnLoan = useCallback(
    (
      bookingRef: string,
      occupantId: string,
      itemName: LoanItem,
      countToRemove: number
    ) => {
      handleReturnLoanTransaction(
        bookingRef,
        occupantId,
        itemName,
        countToRemove
      );
    },
    [handleReturnLoanTransaction]
  );
  return (
    <div className="min-h-[80vh] p-4 bg-gray-100 font-sans text-gray-800 dark:bg-darkBg dark:text-darkAccentGreen">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        LOANS
      </h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-4 dark:bg-darkSurface">
        {error && (
          <div className="p-4 text-red-600 font-semibold">
            Error loading loan data: {String(error)}
          </div>
        )}
        <LoanFilters
          username={username}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          guestFilter={guestFilter}
          onGuestFilterChange={setGuestFilter}
        />
        {loading && (
          <div className="italic text-gray-600 dark:text-darkAccentGreen">
            Loading loan information...
          </div>
        )}
        {!loading && guests?.length === 0 && (
          <div className="italic text-gray-600 dark:text-darkAccentGreen">
            No guests found for this date.
          </div>
        )}
        {!loading && filteredData.length === 0 && (guests?.length ?? 0) > 0 && (
          <div className="italic text-gray-600 dark:text-darkAccentGreen">
            No guests match your search.
          </div>
        )}
        {!loading && filteredData.length > 0 && (
          <LoansTable
            guests={filteredData}
            onAddLoan={onAddLoan}
            onReturnLoan={onReturnLoan}
            buttonDisabled={buttonDisabled}
          />
        )}
      </div>
    </div>
  );
}
export const Loans = memo(LoansContainer);
export default memo(LoansContainer);
