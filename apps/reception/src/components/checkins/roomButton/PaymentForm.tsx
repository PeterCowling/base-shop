// File: /src/components/checkins/roomButton/PaymentForm.tsx

import {
  memo,
  useState,
} from "react";
import { Banknote, CreditCard, Plus } from "lucide-react";

import { Button, Popover, PopoverContent, PopoverTrigger } from "@acme/design-system/atoms";

import { formatEuro } from "../../../utils/format";

import { usePaymentContext } from "./PaymentContext";
import SplitList from "./SplitList";

const PF_ACTIVE = "bg-primary-main hover:opacity-90 text-primary-fg";
const PF_DISABLED = "bg-success-main text-success-fg cursor-not-allowed opacity-70";

function PaymentForm() {
  const {
    outstanding,
    splitPayments,
    isDisabled,
    handleImmediatePayment,
  } = usePaymentContext();

  const [menuOpen, setMenuOpen] = useState(false);

  const PayTypeIcon =
    splitPayments.length === 1
      ? splitPayments[0].payType === "CC" ? CreditCard : Banknote
      : Plus;

  const buttonLabel =
    outstanding > 0
      ? splitPayments.length === 1 ? formatEuro(outstanding) : `Split ${formatEuro(outstanding)}`
      : "Paid";

  const btnVariant = isDisabled ? PF_DISABLED : PF_ACTIVE;

  return (
    <Popover open={menuOpen} onOpenChange={(next) => { if (!isDisabled) setMenuOpen(next); }}>
      <div className="relative">
        <div className="flex items-stretch rounded-md overflow-hidden">
          <PopoverTrigger asChild>
            <Button
              compatibilityMode="passthrough"
              disabled={isDisabled}
              className={`h-9 px-2.5 flex items-center justify-center focus:outline-none transition-colors rounded-none ${btnVariant}`}
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
            className={`h-9 px-2.5 flex items-center justify-center focus:outline-none transition-colors rounded-none text-xs font-medium ${btnVariant}`}
            title={
              isDisabled
                ? "Payment not possible (already paid)"
                : "Pay immediately with selected split"
            }
          >
            {buttonLabel}
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
