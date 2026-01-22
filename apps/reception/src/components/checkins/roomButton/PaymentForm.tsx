// File: /src/components/checkins/roomButton/PaymentForm.tsx

import {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import {
  faCreditCard,
  faMoneyBill,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hideMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuPositionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (menuOpen) {
      setMenuVisible(true);
    } else {
      hideMenuTimeoutRef.current = setTimeout(
        () => setMenuVisible(false),
        200
      );
    }
    return () => {
      if (hideMenuTimeoutRef.current) {
        clearTimeout(hideMenuTimeoutRef.current);
      }
    };
  }, [menuOpen]);

  const handleMenuToggle = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!menuOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      } else {
        if (menuPositionTimeoutRef.current) {
          clearTimeout(menuPositionTimeoutRef.current);
        }
        menuPositionTimeoutRef.current = setTimeout(
          () => setMenuPosition(null),
          200
        );
      }
      setMenuOpen((prev) => !prev);
    },
    [menuOpen]
  );

  useEffect(() => {
    return () => {
      if (hideMenuTimeoutRef.current) {
        clearTimeout(hideMenuTimeoutRef.current);
      }
      if (menuPositionTimeoutRef.current) {
        clearTimeout(menuPositionTimeoutRef.current);
      }
    };
  }, []);

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
    <>
      <div className="relative flex items-center">
        <button
          ref={buttonRef}
          onClick={handleMenuToggle}
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

      {menuVisible &&
        menuPosition &&
        ReactDOM.createPortal(
          <PaymentDropdown
            menuOpen={menuOpen}
            menuPosition={menuPosition}
            splitPayments={splitPayments}
            handleAmountChange={handleAmountChange}
            handleSetPayType={handleSetPayType}
            handleAddPaymentRow={handleAddPaymentRow}
            handleRemovePaymentRow={handleRemovePaymentRow}
            handleImmediatePayment={handleImmediatePayment}
            isDisabled={isDisabled}
            setMenuOpen={setMenuOpen}
            setMenuPosition={setMenuPosition}
          />,
          document.body
        )}
    </>
  );
}

export default memo(PaymentForm);
