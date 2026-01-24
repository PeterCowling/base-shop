import { useMemo } from "react";

import { settings } from "../../../constants/settings";
import { type CreditSlip, type Transaction } from "../../../types/component/Till";
import { type CashCount } from "../../../types/hooks/data/cashCountData";
import { type SafeCount } from "../../../types/hooks/data/safeCountData";
import { toEpochMillis } from "../../../utils/dateUtils";

interface Params {
  transactions: Transaction[];
  creditSlips: CreditSlip[];
  cashCounts: CashCount[];
  safeCounts: SafeCount[];
  shiftOpenTime: Date | null;
  previousShiftCloseTime: Date | null;
  openingCash: number;
  openingKeycards: number;
  finalCashCount: number;
  cashDrawerLimit?: number;
}

const isVoidedTransaction = (txn: Transaction) =>
  Boolean(txn.voidedAt || txn.voidedBy || txn.voidReason || txn.voidedShiftId);

export function useShiftCalculations({
  transactions,
  creditSlips,
  cashCounts,
  safeCounts,
  shiftOpenTime,
  previousShiftCloseTime,
  openingCash,
  openingKeycards,
  finalCashCount,
  cashDrawerLimit,
}: Params) {
  const filteredTransactions = useMemo<Transaction[]>(() => {
    if (!shiftOpenTime) return [];
    return transactions.filter((txn) => {
      if (!txn.timestamp) return false;
      return toEpochMillis(txn.timestamp) >= shiftOpenTime.getTime();
    });
  }, [transactions, shiftOpenTime]);

  const activeTransactions = useMemo(
    () => filteredTransactions.filter((txn) => !isVoidedTransaction(txn)),
    [filteredTransactions]
  );

  const creditSlipsThisShift = useMemo(() => {
    if (!shiftOpenTime) return [] as CreditSlip[];
    return creditSlips.filter(
      (s) => toEpochMillis(s.timestamp) >= shiftOpenTime.getTime()
    );
  }, [creditSlips, shiftOpenTime]);

  const creditSlipTotal = useMemo(
    () => creditSlipsThisShift.reduce((sum, s) => sum + s.amount, 0),
    [creditSlipsThisShift]
  );

  const cashTxns = useMemo(
    () =>
      activeTransactions.filter(
        (t) =>
          (t.method === "CASH" || t.method === "cash") && t.type !== "PAYMENT"
      ),
    [activeTransactions]
  );

  const salesCash = useMemo(
    () =>
      cashTxns
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [cashTxns]
  );

  const refundCash = useMemo(
    () =>
      cashTxns
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [cashTxns]
  );

  const netCash = useMemo(
    () => salesCash - refundCash - creditSlipTotal,
    [salesCash, refundCash, creditSlipTotal]
  );

  const netCC = useMemo(
    () =>
      activeTransactions
        .filter(
          (t) =>
            (t.method === "CC" || t.method === "card") && t.type !== "PAYMENT"
        )
        .reduce((sum, t) => sum + t.amount, 0),
    [activeTransactions]
  );

  const docDepositsCount = useMemo(() => {
    const docMethods = ["PASSPORT", "LICENSE", "ID"];
    return activeTransactions.filter(
      (t) => docMethods.includes(t.method || "") && t.type === "Refund"
    ).length;
  }, [activeTransactions]);

  const docReturnsCount = useMemo(
    () =>
      activeTransactions.filter(
        (t) => t.method === "DOCUMENT" && t.type === "loanReturn"
      ).length,
    [activeTransactions]
  );

  const keycardsLoaned = useMemo(
    () =>
      activeTransactions
        .filter((t) => t.type === "Loan" && t.isKeycard)
        .reduce((sum, t) => sum + (t.count || 0), 0),
    [activeTransactions]
  );

  const keycardsReturned = useMemo(
    () =>
      activeTransactions
        .filter((t) => t.type === "Refund" && t.isKeycard)
        .reduce((sum, t) => sum + (t.count || 0), 0),
    [activeTransactions]
  );

  const floatEntryTotal = useMemo(
    () =>
      cashCounts
        .filter(
          (c) =>
            c.type === "float" &&
            c.amount &&
            shiftOpenTime &&
            toEpochMillis(c.timestamp) >= shiftOpenTime.getTime()
        )
        .reduce((sum, c) => sum + (c.amount || 0), 0),
    [cashCounts, shiftOpenTime]
  );

  const tenderRemovalTotal = useMemo(
    () =>
      cashCounts
        .filter(
          (c) =>
            c.type === "tenderRemoval" &&
            c.amount &&
            shiftOpenTime &&
            toEpochMillis(c.timestamp) >= shiftOpenTime.getTime()
        )
        .reduce((sum, c) => sum + (c.amount || 0), 0),
    [cashCounts, shiftOpenTime]
  );

  const safeWithdrawalTotal = useMemo(
    () =>
      safeCounts
        .filter(
          (s) =>
            s.type === "withdrawal" &&
            s.amount &&
            shiftOpenTime &&
            toEpochMillis(s.timestamp) >= shiftOpenTime.getTime()
        )
        .reduce((sum, s) => sum + (s.amount || 0), 0),
    [safeCounts, shiftOpenTime]
  );

  const safeDepositTotal = useMemo(
    () =>
      safeCounts
        .filter(
          (s) =>
            s.type === "deposit" &&
            s.amount &&
            shiftOpenTime &&
            toEpochMillis(s.timestamp) >= shiftOpenTime.getTime()
        )
        .reduce((sum, s) => sum + (s.amount || 0), 0),
    [safeCounts, shiftOpenTime]
  );

  const hasFloatEntries = useMemo(
    () =>
      cashCounts.some(
        (c) =>
          c.type === "float" &&
          shiftOpenTime &&
          toEpochMillis(c.timestamp) >= shiftOpenTime.getTime()
      ),
    [cashCounts, shiftOpenTime]
  );

  const hasTenderRemovals = useMemo(
    () =>
      cashCounts.some(
        (c) =>
          c.type === "tenderRemoval" &&
          shiftOpenTime &&
          toEpochMillis(c.timestamp) >= shiftOpenTime.getTime()
      ),
    [cashCounts, shiftOpenTime]
  );

  const expectedCashAtClose = useMemo(
    () =>
      openingCash +
      netCash +
      floatEntryTotal -
      tenderRemovalTotal +
      (hasFloatEntries ? 0 : safeWithdrawalTotal) -
      (hasTenderRemovals ? 0 : safeDepositTotal),
    [
      openingCash,
      netCash,
      floatEntryTotal,
      tenderRemovalTotal,
      safeWithdrawalTotal,
      safeDepositTotal,
      hasFloatEntries,
      hasTenderRemovals,
    ]
  );

  const drawerCash = expectedCashAtClose;

  const expectedKeycardsAtClose = useMemo(
    () => openingKeycards - keycardsLoaned + keycardsReturned,
    [openingKeycards, keycardsLoaned, keycardsReturned]
  );

  const isDrawerOverLimit = useMemo(
    () =>
      cashDrawerLimit
        ? netCash > cashDrawerLimit || finalCashCount > cashDrawerLimit
        : false,
    [cashDrawerLimit, netCash, finalCashCount]
  );

  const isTillOverMax = useMemo(() => {
    const limit = cashDrawerLimit ?? settings.tillMaxLimit;
    return expectedCashAtClose > limit;
  }, [expectedCashAtClose, cashDrawerLimit]);

  const pinRequiredForTenderRemoval =
    isDrawerOverLimit && settings.pinRequiredAboveLimit;

  const ccTransactionsFromLastShift = useMemo<Transaction[]>(() => {
    if (!previousShiftCloseTime) return [];
    return transactions.filter((t) => {
      if (isVoidedTransaction(t)) return false;
      const isCard = t.method === "CC" || t.method === "card";
      if (!isCard || !t.timestamp || t.amount === 0) return false;
      const txnTime = toEpochMillis(t.timestamp);
      return (
        txnTime >= previousShiftCloseTime.getTime() &&
        (!shiftOpenTime || txnTime < shiftOpenTime.getTime())
      );
    });
  }, [transactions, shiftOpenTime, previousShiftCloseTime]);

  const ccTransactionsFromThisShift = useMemo<Transaction[]>(() => {
    if (!shiftOpenTime) return [];
    return transactions.filter((t) => {
      if (isVoidedTransaction(t)) return false;
      const isCard = t.method === "CC" || t.method === "card";
      if (!isCard || !t.timestamp || t.amount === 0) return false;
      const txnTime = toEpochMillis(t.timestamp);
      return txnTime >= shiftOpenTime.getTime();
    });
  }, [transactions, shiftOpenTime]);

  return {
    filteredTransactions,
    creditSlipTotal,
    netCash,
    netCC,
    docDepositsCount,
    docReturnsCount,
    keycardsLoaned,
    keycardsReturned,
    expectedKeycardsAtClose,
    expectedCashAtClose,
    drawerCash,
    isDrawerOverLimit,
    isTillOverMax,
    pinRequiredForTenderRemoval,
    ccTransactionsFromLastShift,
    ccTransactionsFromThisShift,
    floatEntryTotal,
    tenderRemovalTotal,
    safeWithdrawalTotal,
    safeDepositTotal,
  };
}
