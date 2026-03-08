// File: /src/components/checkins/roomButton/PaymentForm.tsx

import {
  memo,
  useCallback,
  useState,
} from "react";
import { Banknote, CreditCard, Plus } from "lucide-react";

import { Button, Popover, PopoverContent, PopoverTrigger } from "@acme/design-system/atoms";

import { usePaymentContext } from "./PaymentContext";
import SplitList from "./SplitList";

function PaymentForm() {
  const {
    outstanding,
    splitPayments,
    isDisabled,
    handleImmediatePayment,
  } = usePaymentContext();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (isDisabled) return;
      setMenuOpen(next);
    },
    [isDisabled]
  );

  const PayTypeIcon = (() => {
    if (splitPayments.length === 1) {
      return splitPayments[0].payType === "CC" ? CreditCard : Banknote;
    }
    return Plus;
  })();

  const getButtonLabel = useCallback(() => {
    if (outstanding > 0) {
      if (splitPayments.length === 1) {
        return `€${outstanding.toFixed(2)}`;
      }
      return `Split €${outstanding.toFixed(2)}`;
    }
    return "Paid";
  }, [outstanding, splitPayments]);

  const activeClass = "bg-primary-main/100 hover:opacity-90 text-primary-fg/100";
  const disabledClass =
    "bg-success-main/100 text-foreground cursor-not-allowed opacity-70";
  const leftButtonClass = isDisabled ? disabledClass : activeClass;
  const rightButtonClass = isDisabled ? disabledClass : activeClass;

  return (
    <Popover open={menuOpen} onOpenChange={handleOpenChange}>
      <div className="relative">
        <div className="flex items-stretch rounded-md overflow-hidden">
          <PopoverTrigger asChild>
            <Button
              compatibilityMode="passthrough"
              disabled={isDisabled}
              className={`h-9 px-2.5 flex items-center justify-center focus:outline-none transition-colors rounded-none ${leftButtonClass}`}
              title={
                isDisabled
                  ? "Payment not possible (already paid)"
                  : "Click to split/change payment"
              }
            >
              <PayTypeIcon size={16} />
            </Button>
          </PopoverTrigger>
          <div className="w-px self-stretch bg-border-1" />
          <Button
            compatibilityMode="passthrough"
            onClick={handleImmediatePayment}
            disabled={isDisabled}
            className={`h-9 px-2.5 flex items-center justify-center focus:outline-none transition-colors rounded-none text-xs font-medium ${rightButtonClass}`}
            title={
              isDisabled
                ? "Payment not possible (already paid)"
                : "Pay immediately with selected split"
            }
          >
            {getButtonLabel()}
          </Button>
        </div>
      </div>

      <PopoverContent align="start" sideOffset={6} className="p-0">
        <div className="w-72 p-3">
          <SplitList />
          <Button
            onClick={handleImmediatePayment}
            disabled={isDisabled}
            className={`w-full bg-primary-dark hover:bg-primary-main text-primary-fg rounded-lg px-3 py-1 mt-2 focus:outline-none transition-colors
              ${isDisabled ? "cursor-not-allowed opacity-70" : ""}`}
          >
            Confirm Payment
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default memo(PaymentForm);
