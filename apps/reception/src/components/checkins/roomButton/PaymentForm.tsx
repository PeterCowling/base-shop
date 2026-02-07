// File: /src/components/checkins/roomButton/PaymentForm.tsx

import {
  memo,
  type MouseEvent,
  useCallback,
  useState,
} from "react";
import {
  faCreditCard,
  faMoneyBill,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Popover, PopoverContent, PopoverTrigger } from "@acme/design-system/atoms";

import type {
  PaymentSplit,
  PaymentType,
} from "../../../types/component/roomButton/types";

import PaymentDropdown from "./PaymentDropdown";

interface PaymentFormProps {
  outstanding: number;
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

function PaymentForm({
  outstanding,
  splitPayments,
  handleAmountChange,
  handleSetPayType,
  handleAddPaymentRow,
  handleRemovePaymentRow,
  handleImmediatePayment,
  isDisabled,
}: PaymentFormProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (isDisabled) return;
      setMenuOpen(next);
    },
    [isDisabled]
  );

  const getPayTypeIcon = useCallback(() => {
    if (splitPayments.length === 1) {
      return splitPayments[0].payType === "CC" ? faCreditCard : faMoneyBill;
    }
    return faPlus;
  }, [splitPayments]);

  const getPayTypeTooltip = useCallback(() => {
    if (splitPayments.length === 1) {
      return splitPayments[0].payType === "CC" ? "Credit Card" : "Cash";
    }
    return "Split Payment";
  }, [splitPayments]);

  const getButtonLabel = useCallback(() => {
    if (outstanding > 0) {
      if (splitPayments.length === 1) {
        return `€${outstanding.toFixed(2)}`;
      }
      return `Split €${outstanding.toFixed(2)}`;
    }
    return "Paid";
  }, [outstanding, splitPayments]);

  const activeClass = "bg-primary-main hover:bg-primary-dark text-white dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80";
  const disabledClass =
    "bg-success-light text-white cursor-not-allowed opacity-70";
  const leftButtonClass = isDisabled
    ? disabledClass
    : `${activeClass} border-r border-gray-200/20`;
  const rightButtonClass = isDisabled ? disabledClass : activeClass;

  return (
    <Popover open={menuOpen} onOpenChange={handleOpenChange}>
      <div className="relative flex items-center">
        <PopoverTrigger asChild>
          <button
            disabled={isDisabled}
            style={{ height: "55px" }}
            className={`px-4 flex items-center justify-center focus:outline-none transition-colors rounded-l ${leftButtonClass}`}
            title={
              isDisabled
                ? "Payment not possible (already paid)"
                : "Click to split/change payment"
            }
          >
            <FontAwesomeIcon
              icon={getPayTypeIcon()}
              size="lg"
              title={getPayTypeTooltip()}
            />
          </button>
        </PopoverTrigger>
        <button
          onClick={handleImmediatePayment}
          disabled={isDisabled}
          className={`min-h-[55px] px-[11px] flex items-center justify-center focus:outline-none transition-colors rounded-r ${rightButtonClass}`}
          title={
            isDisabled
              ? "Payment not possible (already paid)"
              : "Pay immediately with selected split"
          }
        >
          {getButtonLabel()}
        </button>
      </div>

      <PopoverContent align="start" sideOffset={6} className="p-0">
        <PaymentDropdown
          splitPayments={splitPayments}
          handleAmountChange={handleAmountChange}
          handleSetPayType={handleSetPayType}
          handleAddPaymentRow={handleAddPaymentRow}
          handleRemovePaymentRow={handleRemovePaymentRow}
          handleImmediatePayment={handleImmediatePayment}
          isDisabled={isDisabled}
        />
      </PopoverContent>
    </Popover>
  );
}

export default memo(PaymentForm);
