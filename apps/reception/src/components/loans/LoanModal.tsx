// File: /Users/petercowling/reception/src/components/loans/LoanModal.tsx
import React, {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faFileAlt, faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { type LoanItem, type LoanMethod } from "../../types/hooks/data/loansData";

/**
 * Occupant shape for the modal.
 */
interface Occupant {
  guestId: string;
  bookingRef: string;
  firstName: string;
  lastName: string;
}

interface LoanModalProps {
  isOpen: boolean;
  mode: "loan" | "return";
  occupant?: Occupant;
  item?: LoanItem;
  maxCount?: number;
  method?: LoanMethod;
  onClose: () => void;
  onConfirm: (count: number, depositType?: LoanMethod) => void;
}

/**
 * Modal for entering count (and deposit method, if loaning).
 *
 * Presentation Enhancements:
 * 1. Uses additional whitespace and sections (Tailwind-based) for clarity.
 * 2. Groups occupant details, item details, and controls in visually distinct sections.
 * 3. Aligned text properly for better readability.
 */
function LoanModalComponent({
  isOpen,
  mode,
  occupant,
  item,
  maxCount,
  method,
  onClose,
  onConfirm,
}: LoanModalProps): ReactElement | null {
  const [countInput, setCountInput] = useState<string>("1");

  /**
   * We'll store the deposit type as a general string,
   * but we'll only show the dropdown if item === "Keycard."
   */
  const [depositType, setDepositType] = useState<LoanMethod>("CASH");

  const depositIcon = useMemo(
    (): { icon: IconDefinition; className: string } =>
      depositType === "CASH"
        ? { icon: faMoneyBill, className: "text-green-400" }
        : { icon: faFileAlt, className: "text-yellow-400" },
    [depositType]
  );

  /**
   * Derive the price based on the item name.
   */
  const itemPrice = useMemo(() => {
    if (item === "Hairdryer" || item === "Steamer") {
      return 20;
    }
    // For Keycard or any other items, it's 10
    return 10;
  }, [item]);

  /**
   * When the modal opens:
   * - Reset count to 1.
   * - If the item is "Keycard," default depositType is "CASH" (or the parent's method).
   * - If the item is anything else, depositType is forced to "CASH".
   */
  useEffect(() => {
    if (isOpen) {
      setCountInput("1");
      if (item === "Keycard") {
        setDepositType(method || "CASH");
      } else {
        setDepositType("CASH");
      }
    }
  }, [isOpen, item, method]);

  /**
   * Handle changes in the count field.
   */
  const handleCountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCountInput(e.target.value);
    },
    []
  );

  /**
   * If the item is "Keycard," the user can pick from
   * "CASH" | "PASSPORT" | "LICENSE" | "ID".
   */
  const handleDepositTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setDepositType(e.target.value as LoanMethod);
    },
    []
  );

  /**
   * On confirm, pass count and depositType back to the parent, then close.
   */
  const handleSubmit = useCallback(() => {
    const parsedCount = parseInt(countInput, 10);
    onConfirm(Number.isNaN(parsedCount) ? 1 : parsedCount, depositType);
    onClose();
  }, [countInput, depositType, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50"
      role="dialog"
      aria-labelledby="loanModalTitle"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg dark:bg-darkSurface">
        {/* Header Section */}
        <div className="px-6 py-4 border-b border-gray-400 flex justify-between items-center">
          <h2
            id="loanModalTitle"
            className="text-xl font-bold tracking-wide text-gray-800 dark:text-darkAccentGreen"
          >
            {mode === "loan" ? "Add Loan" : "Return Item"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-700 focus:outline-none dark:text-darkAccentGreen"
            aria-label="Close Modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content Section */}
        <div className="px-6 py-4 space-y-6">
          {/* Occupant Details */}
          {occupant && (
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded dark:bg-darkSurface dark:text-darkAccentGreen">
              <div className="font-semibold">Occupant:</div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-1">
                <span>
                  {occupant.firstName} {occupant.lastName}
                </span>
                <span className="text-gray-700">
                  Ref: {occupant.bookingRef}
                </span>
              </div>
            </div>
          )}

          {/* Item Details */}
          <div className="bg-gray-50 p-3 rounded dark:bg-darkSurface">
            <label className="block font-semibold mb-1 text-gray-700 dark:text-darkAccentGreen">
              {mode === "loan" ? "Loan Item:" : "Return Item:"}
            </label>
            <div className="text-gray-800 dark:text-darkAccentGreen">{item || "No item specified"}</div>
            {mode === "loan" && (
              <div className="text-sm text-gray-600 mt-1 dark:text-darkAccentGreen">
                Price: {itemPrice}
              </div>
            )}
          </div>

          {/* Quantity Input */}
          <div className="bg-gray-50 p-3 rounded dark:bg-darkSurface">
            <label
              htmlFor="countInput"
              className="block font-semibold mb-1 text-gray-700 dark:text-darkAccentGreen"
            >
              {mode === "loan" ? "Quantity to Loan" : "Quantity to Return"}
            </label>
            <div className="flex items-center">
              <input
                id="countInput"
                type="number"
                value={countInput}
                min={1}
                max={maxCount || 99}
                onChange={handleCountChange}
                className="border rounded px-2 py-1 w-20 me-2"
              />
              {maxCount !== undefined && mode === "return" && (
                <span className="text-sm text-gray-600 dark:text-darkAccentGreen">(Max: {maxCount})</span>
              )}
            </div>
          </div>

          {/* Deposit Method (only visible if mode === "loan" && item === "Keycard") */}
          {mode === "loan" && item === "Keycard" && (
            <div className="bg-gray-50 p-3 rounded dark:bg-darkSurface">
              <label
                htmlFor="depositMethod"
                className="block font-semibold mb-1 text-gray-700 flex items-center gap-2 dark:text-darkAccentGreen"
              >
                Deposit Method
                <FontAwesomeIcon
                  icon={depositIcon.icon}
                  className={depositIcon.className}
                />
              </label>
              <select
                id="depositMethod"
                value={depositType}
                onChange={handleDepositTypeChange}
                className="border rounded px-2 py-1 w-full dark:bg-darkSurface dark:text-darkAccentGreen"
              >
                <option value="CASH">Cash</option>
                <option value="PASSPORT">Passport</option>
                <option value="LICENSE">License</option>
                <option value="ID">ID</option>
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-400 flex justify-end items-center space-x-2 dark:border-darkAccentGreen">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded dark:bg-darkSurface dark:text-darkAccentGreen"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded dark:bg-darkAccentGreen dark:text-darkBg"
            onClick={handleSubmit}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export const LoanModal = memo(LoanModalComponent);
export default LoanModal;
