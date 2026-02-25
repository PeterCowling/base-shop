// src/components/EntryDialogue.tsx (or EntryDialog.tsx)

import React, {
  type ChangeEvent,
  type ClipboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

import { creditCardSchema } from "../../schemas/creditCardSchema";
import { formatCreditCardNumber } from "../../utils/creditCardUtils"; // Adjust path as needed
import { showToast } from "../../utils/toastUtils";

interface PaymentInfo {
  cardNumber: string;
  expiry: string;
}

// Keep status consistent with Prepayments
type PaymentStatus = "failed" | "paid";

interface EntryDialogProps {
  open: boolean;
  initialCardNumber?: string;
  initialExpiry?: string;
  amountToCharge?: number; // Added for context display
  bookingRef?: string; // Added for context display
  onClose: () => void;
  // Callback triggered when 'Process Payment' is clicked (only shown if card exists)
  onProcessPayment: (status: PaymentStatus) => Promise<void>;
  // Callback triggered when 'Save CC Details' or 'Update CC Details' is clicked
  onSaveOrUpdate: (paymentInfo: PaymentInfo) => Promise<void>; // Make async if needed
  // Add isFetchingDetails prop if you implement specific CC fetching status later
  // isFetchingDetails?: boolean;
}

/**
 * A dialog for entering or updating payment details (card number & expiry)
 * and optionally triggering a payment attempt.
 */
const EntryDialog: React.FC<EntryDialogProps> = ({
  open,
  initialCardNumber = "",
  initialExpiry = "",
  amountToCharge,
  bookingRef,
  onClose,
  onProcessPayment,
  onSaveOrUpdate,
  // isFetchingDetails = false, // Uncomment if using specific loading state later
}) => {
  // Internal state for the form fields
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // Loading state for async actions
  const [isSaving, setIsSaving] = useState<boolean>(false); // Loading state for save/update action

  // Effect to reset/initialize state when initial props change (e.g., different booking selected)
  useEffect(() => {
    setCardNumber(formatCreditCardNumber(initialCardNumber)); // Format initial number
    setExpiryDate(initialExpiry);
  }, [initialCardNumber, initialExpiry, open]); // Re-run if dialog opens or initial data changes

  // Determine if card details existed initially
  const hasExistingCard = !!(initialCardNumber && initialExpiry);

  // Determine the text for the save/update button
  const saveButtonText = hasExistingCard
    ? "Update CC Details"
    : "Save CC Details";

  // --- Input Handlers ---

  const handleCreditCardChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\s/g, ""); // Remove spaces for validation/length check
    if (/^\d*$/.test(rawValue) && rawValue.length <= 16) {
      // Allow only digits, max 16
      setCardNumber(formatCreditCardNumber(rawValue)); // Format for display
    }
  };

  const handleCreditCardPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("Text");
    let rawValue = pasteData.replace(/\s/g, "").replace(/\D/g, ""); // Remove spaces and non-digits
    if (rawValue.length > 16) {
      rawValue = rawValue.slice(0, 16);
    }
    setCardNumber(formatCreditCardNumber(rawValue));
  };

  const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only digits and slash, format MM/YY
    let formatted = input.replace(/\D/g, ""); // Remove non-digits
    if (formatted.length > 4) formatted = formatted.slice(0, 4); // Max 4 digits (MMYY)

    if (formatted.length >= 3) {
      // Insert slash MM/Y... or MM/YY
      setExpiryDate(`${formatted.slice(0, 2)}/${formatted.slice(2)}`);
    } else if (formatted.length > 0) {
      setExpiryDate(formatted); // Allow typing MM or M
    } else {
      setExpiryDate(""); // Clear if empty
    }
  };

  // --- Action Handlers ---

  const handleSaveOrUpdate = useCallback(async () => {
    // Validate fields using Zod schema
    const result = creditCardSchema.safeParse({
      cardNumber,
      expiry: expiryDate,
    });
    if (!result.success) {
      showToast(result.error.errors[0]?.message ?? "Invalid card details", "error");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveOrUpdate({ cardNumber: cardNumber, expiry: expiryDate });
      // Success message is handled in the parent component
    } catch (error) {
      // Error message is handled in the parent component
      console.error("Dialog: Failed to save/update", error);
    } finally {
      setIsSaving(false);
    }
  }, [cardNumber, expiryDate, onSaveOrUpdate]);

  // Simulate payment processing (replace with actual payment gateway integration)
  const handleProcessClick = useCallback(async () => {
    setIsProcessing(true);
    console.log("Attempting payment with card:", cardNumber);
    // --- !!! Placeholder for actual payment gateway interaction !!! ---
    // Example: Replace this timeout with your actual payment API call
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay
    const paymentSuccess = Math.random() > 0.3; // Simulate success/failure
    // --- !!! End Placeholder !!! ---

    try {
      await onProcessPayment(paymentSuccess ? "paid" : "failed");
      // Parent handles messaging and state updates based on status
    } catch (error) {
      // Parent handles messaging
      console.error("Dialog: Error during payment processing callback", error);
    } finally {
      setIsProcessing(false);
    }
  }, [cardNumber, onProcessPayment]); // Include cardNumber if payment needs it immediately

  // Conditional loading/feedback inside the dialog
  // const showSpinner = isFetchingDetails || isProcessing || isSaving; // Combine loading states

  return (
    <SimpleModal
      isOpen={open}
      onClose={onClose}
      title={hasExistingCard ? "Update or Process Payment" : "Enter Payment Details"}
      maxWidth="max-w-md"
      className="font-body"
      showCloseButton={!isProcessing && !isSaving}
      footer={
        <div className="flex flex-wrap gap-2 justify-end">
          {/* Process button only shows if card details already exist */}
          {hasExistingCard && (
            <Button
              onClick={handleProcessClick}
              disabled={isProcessing || isSaving || !cardNumber || !expiryDate}
              color="primary"
              tone="solid"
            >
              {isProcessing ? "Processing..." : "Process Payment"}
            </Button>
          )}
          {/* Save/Update Button */}
          <Button
            onClick={handleSaveOrUpdate}
            disabled={isProcessing || isSaving || !cardNumber || !expiryDate}
            color="success"
            tone="solid"
          >
            {isSaving ? "Saving..." : saveButtonText}
          </Button>
          {/* Optional Close/Cancel Button */}
          <Button
            onClick={onClose}
            disabled={isProcessing || isSaving}
            color="default"
            tone="soft"
          >
            Cancel
          </Button>
        </div>
      }
    >
      {/* Subtitle shown below title inside body */}
      {(bookingRef || amountToCharge !== undefined) && (
        <p className="text-sm text-muted-foreground mb-4">
          {bookingRef && `Ref: ${bookingRef}`}
          {amountToCharge !== undefined &&
            ` | Amount: €${amountToCharge.toFixed(2)}`}
        </p>
      )}

      {/* Content with optional loading overlay */}
      <div className="relative">
        {/* Loading indicator */}
        {(isProcessing || isSaving) && (
          <div className="absolute inset-0 bg-surface bg-opacity-75 flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-border-2 border-t-primary-main rounded-full animate-spin" />
            <p className="mt-2 text-foreground font-medium">
              {isSaving ? "Saving..." : "Processing..."}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* CC Number Input */}
          <div>
            <label
              htmlFor="creditCardNumber"
              className="block text-sm font-heading text-foreground mb-1"
            >
              Credit Card Number
            </label>
            <Input
              compatibilityMode="no-wrapper"
              id="creditCardNumber"
              type="text" // Use text to allow formatted input
              inputMode="numeric" // Hint for mobile keyboards
              autoComplete="cc-number"
              className="w-full border border-border-2 rounded px-3 py-2 font-mono text-lg" // Use mono font for CC
              placeholder="XXXX XXXX XXXX XXXX"
              value={cardNumber}
              onChange={handleCreditCardChange}
              onPaste={handleCreditCardPaste}
              disabled={isProcessing || isSaving}
            />
          </div>

          {/* Expiry Date Input */}
          <div>
            <label
              htmlFor="expiryDate"
              className="block text-sm font-heading text-foreground mb-1"
            >
              Expiry (MM/YY)
            </label>
            <Input
              compatibilityMode="no-wrapper"
              id="expiryDate"
              type="text" // Use text to allow formatting like "MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              className="w-full border border-border-2 rounded px-3 py-2 font-mono text-lg"
              placeholder="MM/YY"
              value={expiryDate}
              onChange={handleExpiryChange}
              disabled={isProcessing || isSaving}
            />
          </div>
        </div>
      </div>
    </SimpleModal>
  );
};

export default React.memo(EntryDialog); // Use memo if props don't change unnecessarily
