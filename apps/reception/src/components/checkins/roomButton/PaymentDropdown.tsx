// File: /src/components/checkins/roomButton/PaymentDropdown.tsx
import { memo, type MouseEvent } from "react";

import type {
  PaymentSplit,
  PaymentType,
} from "../../../types/component/roomButton/types";

import SplitList from "./SplitList";

interface PaymentDropdownProps {
  splitPayments: PaymentSplit[];
  handleAmountChange: (index: number, newAmount: string) => void;
  handleSetPayType: (index: number, newPayType: PaymentType) => void;
  handleAddPaymentRow: () => void;
  handleRemovePaymentRow: (index: number) => void;
  handleImmediatePayment: (
    event: MouseEvent<HTMLButtonElement>
  ) => Promise<void>;
  isDisabled: boolean;
}

/**
 * Dropdown content for managing multiple split payments.
 */
function PaymentDropdown({
  splitPayments,
  handleAmountChange,
  handleSetPayType,
  handleAddPaymentRow,
  handleRemovePaymentRow,
  handleImmediatePayment,
  isDisabled,
}: PaymentDropdownProps) {
  return (
    <div className="w-72 p-3">
      <SplitList
        splitPayments={splitPayments}
        isDisabled={isDisabled}
        handleAmountChange={handleAmountChange}
        handleSetPayType={handleSetPayType}
        handleAddPaymentRow={handleAddPaymentRow}
        handleRemovePaymentRow={handleRemovePaymentRow}
      />
      {/* Confirm Payment inside the dropdown */}
      <button
        onClick={handleImmediatePayment}
        disabled={isDisabled}
        className={`w-full bg-primary-dark hover:bg-primary-main text-white rounded px-3 py-1 mt-2 focus:outline-none transition-colors dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80
          ${isDisabled ? "cursor-not-allowed opacity-70" : ""}`}
      >
        Confirm Payment
      </button>
    </div>
  );
}

export default memo(PaymentDropdown);
