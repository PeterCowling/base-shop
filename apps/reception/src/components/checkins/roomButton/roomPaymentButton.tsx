// File: /src/components/checkins/roomButton/roomPaymentButton.tsx

import {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useActivitiesMutations from "../../../hooks/mutations/useActivitiesMutations";
import useAllTransactions from "../../../hooks/mutations/useAllTransactionsMutations";
import useFinancialsRoomMutations from "../../../hooks/mutations/useFinancialsRoomMutations";
import { type CheckInRow } from "../../../types/component/CheckinRow";
import type {
  PaymentSplit,
  PaymentType,
} from "../../../types/component/roomButton/types";
import { type Bookings } from "../../../types/domains/booking_old";
import {
  type FinancialsRoomData,
  type RoomTransaction,
} from "../../../types/hooks/data/financialsRoomData";
import { getItalyIsoString } from "../../../utils/dateUtils";
import { generateTransactionId } from "../../../utils/generateTransactionId";
import { showToast } from "../../../utils/toastUtils";

import PaymentForm from "./PaymentForm";

/**
 * Safely computes the outstanding amount given a financials object.
 * If 'financials' is undefined, it returns 0.
 */
function computeOutstandingRoom(
  financials?: Bookings["financials"] | FinancialsRoomData
): number {
  if (!financials) return 0;
  const { totalDue = 0, totalPaid = 0 } = financials;
  return totalDue - totalPaid;
}

/** Minimum that row 0 can hold, in euros. */
const MIN_BASE_ROW = 0.1;

/**
 * Helper to round any numeric value to two decimal places. For instance:
 *   fixTwoDecimals(12.345) => 12.35
 *   fixTwoDecimals(12.0)   => 12.00
 */
function fixTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Payment type guard: ensures the string is a valid PaymentType.
 */
function coercePayType(pt: string): PaymentType {
  return pt === "CASH" ? "CASH" : "CC";
}

/**
 * Hook for occupant's local financial data & outstanding amount.
 * It initializes local state from occupantAsBookings.financials,
 * then recomputes as occupant data changes.
 */
function useLocalFinancials(occupantAsBookings: Bookings | null) {
  const defaultFinancials: FinancialsRoomData = useMemo(
    () => ({
      balance: 0,
      totalDue: 0,
      totalPaid: 0,
      totalAdjust: 0,
      transactions: {},
    }),
    []
  );

  const [localFinancials, setLocalFinancials] = useState<
    FinancialsRoomData | undefined
  >(
    occupantAsBookings?.financials
      ? {
          balance: occupantAsBookings.financials.balance || 0,
          totalDue: occupantAsBookings.financials.totalDue || 0,
          totalPaid: occupantAsBookings.financials.totalPaid || 0,
          totalAdjust: occupantAsBookings.financials.totalAdjust ?? 0,
          transactions: occupantAsBookings.financials.transactions || {},
        }
      : defaultFinancials
  );

  // Sync if the underlying financials object changes.
  const financialsEqual = (
    a?: FinancialsRoomData,
    b?: FinancialsRoomData
  ): boolean => {
    if (!a || !b) return false;
    return (
      a.balance === b.balance &&
      a.totalDue === b.totalDue &&
      a.totalPaid === b.totalPaid &&
      a.totalAdjust === b.totalAdjust &&
      JSON.stringify(a.transactions) === JSON.stringify(b.transactions)
    );
  };

  useEffect(() => {
    const updated = occupantAsBookings?.financials
      ? {
          balance: occupantAsBookings.financials.balance || 0,
          totalDue: occupantAsBookings.financials.totalDue || 0,
          totalPaid: occupantAsBookings.financials.totalPaid || 0,
          totalAdjust: occupantAsBookings.financials.totalAdjust ?? 0,
          transactions: occupantAsBookings.financials.transactions || {},
        }
      : defaultFinancials;

    setLocalFinancials((prev) =>
      financialsEqual(prev, updated) ? prev : updated
    );
  }, [occupantAsBookings, defaultFinancials]);

  const outstanding = useMemo(
    () => computeOutstandingRoom(localFinancials),
    [localFinancials]
  );

  return {
    localFinancials,
    setLocalFinancials,
    outstanding,
  };
}

interface RoomPaymentButtonProps {
  booking: CheckInRow;
}

/**
 * Main payment button component that allows partial/split payments.
 *
 * - splitPayments[0] is the "base" row: originalTotal - sumOfAllOtherRows,
 *   forced >= MIN_BASE_ROW, always stored with two decimals.
 * - Additional rows each store amounts to two decimals and cannot exceed
 *   (originalTotal - MIN_BASE_ROW - sumOfOtherSubRows).
 *
 * Lint fix:
 * - We make 'fixSplits' a stable callback and include it where needed, ensuring
 *   no missing dependencies in the useCallback hooks referencing it.
 * - This avoids continuous warnings from the React Hooks ESLint rules.
 */
function RoomPaymentButton({ booking }: RoomPaymentButtonProps) {
  // Convert occupant to older "Bookings" shape
  const occupantAsBookings = booking as unknown as Bookings;

  // Local financials & occupant's outstanding
  const {
    localFinancials: _localFinancials,
    setLocalFinancials,
    outstanding,
  } = useLocalFinancials(occupantAsBookings);

  // Hooks for side effects / data updates
  const { addActivity } = useActivitiesMutations();
  const { addToAllTransactions } = useAllTransactions();
  const { saveFinancialsRoom } = useFinancialsRoomMutations();

  const [paymentComplete, setPaymentComplete] = useState<boolean>(false);
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);

  // If occupant's local outstanding is 0 or we've already set them paid, disable.
  const isPaid = paymentComplete || outstanding <= 0;
  const isDisabled = buttonDisabled || isPaid;

  // We track occupant's outstanding at initial mount for splitting.
  const [originalTotal] = useState<number>(() => fixTwoDecimals(outstanding));

  // Payment splits local state
  const [splitPayments, setSplitPayments] = useState<PaymentSplit[]>(() => [
    { id: crypto.randomUUID(), amount: originalTotal, payType: "CC" }, // row 0 base
  ]);

  const { occupantId, bookingRef } = booking;

  // -- Make fixSplits stable for use in callbacks.
  const fixSplits = useCallback((splits: PaymentSplit[]): PaymentSplit[] => {
    return splits.map((s) => ({
      id: s.id,
      amount: fixTwoDecimals(s.amount),
      payType: coercePayType(s.payType),
    }));
  }, []);

  /**
   * Recompute row 0:
   *   row0 = originalTotal - sum(subRows), clamped to >= MIN_BASE_ROW,
   *   and round to two decimals.
   */
  const recalcBaseRow = useCallback(
    (allSplits: PaymentSplit[]): PaymentSplit[] => {
      const splitsFixed = fixSplits(allSplits);
      const subRowsSum = splitsFixed
        .slice(1)
        .reduce((acc, item) => acc + item.amount, 0);

      let base = fixTwoDecimals(originalTotal - subRowsSum);
      if (base < MIN_BASE_ROW) {
        base = MIN_BASE_ROW;
      }

      splitsFixed[0] = {
        ...splitsFixed[0],
        amount: fixTwoDecimals(base),
      };
      return splitsFixed;
    },
    [originalTotal, fixSplits]
  );

  /**
   * Finalize payment by saving transactions, occupant’s financial record, occupant activity, etc.
   */
  const handlePayment = useCallback(
    async (splits: PaymentSplit[], owed: number): Promise<void> => {
      if (owed <= 0) {
        showToast("No outstanding balance.", "info");
        return;
      }

      const totalPayment = splits.reduce((sum, p) => sum + p.amount, 0);
      if (totalPayment <= 0) {
        showToast("Please enter a valid amount.", "warning");
        return;
      }

      setButtonDisabled(true);

      const newTransactions: Record<string, RoomTransaction> = {};
      const transactionPromises: Array<Promise<void>> = [];

      for (const split of splits) {
        if (split.amount === 0) continue; // skip zero-amount splits
        const transactionId = generateTransactionId();
        const nowIso = getItalyIsoString();

        const promiseAdd = addToAllTransactions(transactionId, {
          amount: split.amount,
          bookingRef,
          count: 1,
          description: "Room payment",
          itemCategory: "Room payment",
          method: split.payType,
          occupantId,
          timestamp: nowIso,
          type: split.amount >= 0 ? "payment" : "refund",
          user_name: "System",
          nonRefundable: true,
          docType: "roomPayment",
        }).then(() => {
          newTransactions[transactionId] = {
            amount: split.amount,
            nonRefundable: true,
            timestamp: nowIso,
            type: "payment",
            occupantId,
            bookingRef,
          };
        });

        transactionPromises.push(promiseAdd);
      }

      try {
        await Promise.all(transactionPromises);

        if (occupantAsBookings?.financials) {
          const { totalDue = 0, totalPaid = 0 } = occupantAsBookings.financials;
          const newTotalPaid = totalPaid + totalPayment;
          const newBalance = totalDue - newTotalPaid;

          await saveFinancialsRoom(bookingRef, {
            balance: newBalance,
            totalPaid: newTotalPaid,
            transactions: newTransactions,
          });

          setLocalFinancials((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              balance: newBalance,
              totalPaid: newTotalPaid,
              transactions: {
                ...prev.transactions,
                ...newTransactions,
              },
            };
          });
        }

        if (occupantId) {
          await addActivity(occupantId, 8);
        }
        showToast("Room payment successful!", "success");
        setPaymentComplete(true);
      } catch {
        showToast("Error confirming room payment.", "error");
      } finally {
        setButtonDisabled(false);
      }
    },
    [
      occupantId,
      bookingRef,
      occupantAsBookings,
      addToAllTransactions,
      addActivity,
      saveFinancialsRoom,
      setLocalFinancials,
    ]
  );

  /**
   * Handle changing the amount in row i>0, ensuring row 0 remains >= MIN_BASE_ROW.
   */
  const handleAmountChange = useCallback(
    (index: number, newAmount: string) => {
      if (index === 0) {
        // Row 0 is read-only in this design; skip changes if attempted
        return;
      }
      setSplitPayments((old) => {
        const copy = fixSplits(old);
        const typedVal = Math.max(0, parseFloat(newAmount) || 0);

        // Sum of other subrows except the one user is editing
        const sumOthers = copy
          .slice(1)
          .reduce(
            (acc, item, idx2) => (idx2 + 1 === index ? acc : acc + item.amount),
            0
          );

        // Max that can go into row i without pushing row 0 below MIN_BASE_ROW
        const maxRowVal = fixTwoDecimals(
          originalTotal - MIN_BASE_ROW - sumOthers
        );
        const clampedVal = fixTwoDecimals(Math.min(typedVal, maxRowVal));

        copy[index] = { ...copy[index], amount: clampedVal };
        return recalcBaseRow(copy);
      });
    },
    [originalTotal, fixSplits, recalcBaseRow]
  );

  /**
   * Toggle payType for any row.
   */
  const handleSetPayType = useCallback(
    (index: number, newPayType: PaymentType) => {
      setSplitPayments((old) => {
        const copy = fixSplits(old);
        copy[index] = { ...copy[index], payType: newPayType };
        return copy;
      });
    },
    [fixSplits]
  );

  /**
   * Add a new row with 0.00 amount, then recalc row 0.
   */
  const handleAddPaymentRow = useCallback(() => {
    setSplitPayments((old) => {
      const copy = fixSplits(old);
      copy.push({ id: crypto.randomUUID(), amount: 0, payType: "CASH" });
      return recalcBaseRow(copy);
    });
  }, [fixSplits, recalcBaseRow]);

  /**
   * Remove row i>0, returning amount to row 0.
   */
  const handleRemovePaymentRow = useCallback(
    (index: number) => {
      // never remove row 0
      if (index === 0) return;

      setSplitPayments((old) => {
        const copy = fixSplits(old);
        copy.splice(index, 1);
        return recalcBaseRow(copy);
      });
    },
    [fixSplits, recalcBaseRow]
  );

  /**
   * Immediate payment with the current splits.
   */
  const handleImmediatePayment = useCallback(
    (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
      event.stopPropagation();
      if (isDisabled) {
        showToast("Payment not possible (already paid).", "info");
        return Promise.resolve();
      }
      return handlePayment(splitPayments, outstanding);
    },
    [isDisabled, handlePayment, splitPayments, outstanding]
  );

  return (
    <PaymentForm
      outstanding={outstanding}
      splitPayments={splitPayments}
      handleAmountChange={handleAmountChange}
      handleSetPayType={handleSetPayType}
      handleAddPaymentRow={handleAddPaymentRow}
      handleRemovePaymentRow={handleRemovePaymentRow}
      handleImmediatePayment={handleImmediatePayment}
      isDisabled={isDisabled}
    />
  );
}

export default memo(RoomPaymentButton);
