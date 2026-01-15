// File: /src/components/checkins/roomButton/PaymentDropdown.tsx
import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  memo,
  useCallback,
  useEffect,
  useRef,
} from "react";

import type {
  PaymentSplit,
  PaymentType,
} from "../../../types/component/roomButton/types";
import SplitList from "./SplitList";

interface PaymentDropdownProps {
  menuOpen: boolean;
  menuPosition: { top: number; left: number } | null;
  splitPayments: PaymentSplit[];
  handleAmountChange: (index: number, newAmount: string) => void;
  handleSetPayType: (index: number, newPayType: PaymentType) => void;
  handleAddPaymentRow: () => void;
  handleRemovePaymentRow: (index: number) => void;
  handleImmediatePayment: (
    event: MouseEvent<HTMLButtonElement>
  ) => Promise<void>;
  isDisabled: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  setMenuPosition: Dispatch<
    SetStateAction<{ top: number; left: number } | null>
  >;
}

/**
 * Dropdown component for managing multiple split payments.
 * - Row 0 is the "base" row (computed from original total minus the sum of others).
 * - Rows 1..N can be added/removed.
 */
function PaymentDropdown({
  menuOpen,
  menuPosition,
  splitPayments,
  handleAmountChange,
  handleSetPayType,
  handleAddPaymentRow,
  handleRemovePaymentRow,
  handleImmediatePayment,
  isDisabled,
  setMenuOpen,
  setMenuPosition,
}: PaymentDropdownProps) {
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When mouse leaves, close dropdown
  const handleMouseLeave = useCallback(() => {
    setMenuOpen(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => setMenuPosition(null), 200);
  }, [setMenuOpen, setMenuPosition]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: menuPosition?.top ?? 0,
        left: menuPosition?.left ?? 0,
      }}
      className={`z-50 mt-1 w-72 border border-gray-400 rounded shadow-lg p-3 bg-white dark:bg-darkSurface dark:text-darkAccentGreen
        transition-opacity duration-200 transform-gpu
        ${menuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      onMouseLeave={handleMouseLeave}
    >
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
