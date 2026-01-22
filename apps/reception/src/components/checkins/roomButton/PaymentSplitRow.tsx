// File: /src/components/checkins/roomButton/PaymentSplitRow.tsx

import { type ChangeEvent, memo, useCallback } from "react";
import { faCreditCard, faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type {
  PaymentSplit,
  PaymentType,
} from "../../../types/component/roomButton/types";

interface PaymentSplitRowProps {
  index: number;
  sp: PaymentSplit;
  isDisabled: boolean;
  handleAmountChange: (index: number, newAmount: string) => void;
  handleSetPayType: (index: number, newPayType: PaymentType) => void;
  handleAddPaymentRow: () => void;
  handleRemovePaymentRow: (index: number) => void;
  showAddButton: boolean;
}

/**
 * Renders a single row to manage amount and payment type for a split.
 * Row 0 is read-only (the "base" row), while rows 1..N are editable.
 */
function PaymentSplitRow({
  index,
  sp,
  isDisabled,
  handleAmountChange,
  handleSetPayType,
  showAddButton: _showAddButton, // ignoring these props in this row
}: PaymentSplitRowProps) {
  const isRowZero = index === 0;

  const handleAmountInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleAmountChange(index, e.target.value);
    },
    [handleAmountChange, index]
  );

  const togglePayType = useCallback(() => {
    handleSetPayType(index, sp.payType === "CASH" ? "CC" : "CASH");
  }, [handleSetPayType, index, sp.payType]);

  return (
    <>
      {/* Amount input */}
      <input
        type="number"
        className="border border-gray-300 rounded px-2 py-1 w-24 focus:outline-none dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        placeholder="Amount"
        value={sp.amount || ""}
        onChange={handleAmountInput}
        disabled={isDisabled || isRowZero}
        // Row 0 is computed automatically; user cannot type directly.
      />

      {/* Toggle pay type */}
      <button
        className="flex items-center justify-center border border-gray-300 rounded px-2 py-1 focus:outline-none dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
        onClick={togglePayType}
        disabled={isDisabled}
      >
        <FontAwesomeIcon
          icon={sp.payType === "CASH" ? faMoneyBill : faCreditCard}
          className="me-1"
        />
        {sp.payType}
      </button>
    </>
  );
}

export default memo(PaymentSplitRow);
