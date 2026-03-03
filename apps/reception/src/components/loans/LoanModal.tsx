// File: /Users/petercowling/reception/src/components/loans/LoanModal.tsx
import React, {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import { Banknote, FileText } from "lucide-react";

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

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
}: LoanModalProps): ReactElement {
  const [countInput, setCountInput] = useState<string>("1");

  /**
   * We'll store the deposit type as a general string,
   * but we'll only show the dropdown if item === "Keycard."
   */
  const [depositType, setDepositType] = useState<LoanMethod>("CASH");

  const depositIcon = useMemo(
    (): { icon: LucideIcon; className: string } =>
      depositType === "CASH"
        ? { icon: Banknote, className: "text-success-main" }
        : { icon: FileText, className: "text-warning-main" },
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
    (value: string) => {
      setDepositType(value as LoanMethod);
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

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "loan" ? "Add Loan" : "Return Item"}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end items-center space-x-2">
          <Button
            color="default"
            tone="soft"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            tone="solid"
            onClick={handleSubmit}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Occupant Details */}
        {occupant && (
          <div className="text-sm text-foreground bg-surface-2 p-3 rounded-lg">
            <div className="font-semibold">Occupant:</div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-1">
              <span>
                {occupant.firstName} {occupant.lastName}
              </span>
              <span className="text-foreground">
                Ref: {occupant.bookingRef}
              </span>
            </div>
          </div>
        )}

        {/* Item Details */}
        <div className="bg-surface-2 p-3 rounded-lg">
          <label className="block font-semibold mb-1 text-foreground">
            {mode === "loan" ? "Loan Item:" : "Return Item:"}
          </label>
          <div className="text-foreground">{item || "No item specified"}</div>
          {mode === "loan" && (
            <div className="text-sm text-muted-foreground mt-1">
              Price: {itemPrice}
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div className="bg-surface-2 p-3 rounded-lg">
          <label
            htmlFor="countInput"
            className="block font-semibold mb-1 text-foreground"
          >
            {mode === "loan" ? "Quantity to Loan" : "Quantity to Return"}
          </label>
          <div className="flex items-center">
            <Input compatibilityMode="no-wrapper"
              id="countInput"
              type="number"
              value={countInput}
              min={1}
              max={maxCount || 99}
              onChange={handleCountChange}
              className="border rounded-lg px-2 py-1 w-20 me-2"
            />
            {maxCount !== undefined && mode === "return" && (
              <span className="text-sm text-muted-foreground">(Max: {maxCount})</span>
            )}
          </div>
        </div>

        {/* Deposit Method (only visible if mode === "loan" && item === "Keycard") */}
        {mode === "loan" && item === "Keycard" && (
          <div className="bg-surface-2 p-3 rounded-lg">
            <label
              htmlFor="depositMethod"
              className="block font-semibold mb-1 text-foreground flex items-center gap-2"
            >
              Deposit Method
              <depositIcon.icon
                size={16}
                className={depositIcon.className}
              />
            </label>
            <Select value={depositType} onValueChange={handleDepositTypeChange}>
              <SelectTrigger id="depositMethod" className="border rounded-lg px-2 py-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="PASSPORT">Passport</SelectItem>
                <SelectItem value="LICENSE">License</SelectItem>
                <SelectItem value="ID">ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </SimpleModal>
  );
}

export const LoanModal = memo(LoanModalComponent);
export default LoanModal;
