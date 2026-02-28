// File: /src/components/checkins/roomButton/PaymentSplitRow.tsx

import { type ChangeEvent, memo, useCallback } from "react";
import { Banknote, CreditCard } from "lucide-react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

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
      <Input compatibilityMode="no-wrapper"
        type="number"
        className="border border-border-2 rounded-lg px-2 py-1 w-24 focus:outline-none"
        placeholder="Amount"
        value={sp.amount || ""}
        onChange={handleAmountInput}
        disabled={isDisabled || isRowZero}
        // Row 0 is computed automatically; user cannot type directly.
      />

      {/* Toggle pay type */}
      <Button
        className="border border-border-2 rounded-lg px-2 py-1 focus:outline-none min-h-11 min-w-11"
        onClick={togglePayType}
        disabled={isDisabled}
      >
        {sp.payType === "CASH" ? <Banknote size={16} className="me-1" /> : <CreditCard size={16} className="me-1" />}
        {sp.payType}
      </Button>
    </>
  );
}

export default memo(PaymentSplitRow);
