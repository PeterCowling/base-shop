// src/components/EntryDialogue.tsx (or EntryDialog.tsx)

import React, {
  type ChangeEvent,
  type ClipboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import { creditCardSchema } from "../../schemas/creditCardSchema";
import { formatCreditCardNumber } from "../../utils/creditCardUtils"; // Adjust path as needed

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
      alert(result.error.errors[0]?.message ?? "Invalid card details");
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

  // If not open, do not render
  if (!open) return null;

  // Conditional loading/feedback inside the dialog
  // const showSpinner = isFetchingDetails || isProcessing || isSaving; // Combine loading states

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-body p-4">
      {/* Dialog container */}
      <div className="bg-white w-full max-w-md rounded shadow-lg dark-surface dark:text-darkAccentGreen">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-400 dark:border-darkSurface">
          <h2 className="text-lg font-heading">
            {hasExistingCard
              ? "Update or Process Payment"
              : "Enter Payment Details"}{" "}
            <br />
            <span className="text-sm font-normal text-gray-600 dark:text-darkAccentGreen">
              {bookingRef && `Ref: ${bookingRef}`}
              {amountToCharge !== undefined &&
                ` | Amount: €${amountToCharge.toFixed(2)}`}
            </span>
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing || isSaving}
            className="text-gray-700 hover:bg-gray-200 p-1 rounded transition-colors disabled:opacity-50 dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Content with optional loading overlay */}
        <div className="relative">
          {/* Loading indicator */}
          {(isProcessing || isSaving) && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-10 dark:bg-darkBg dark:bg-opacity-80">
              <div className="w-8 h-8 border-4 border-gray-400 border-t-primary-main rounded-full animate-spin dark:border-darkSurface" />
              <p className="mt-2 text-gray-700 font-medium dark:text-darkAccentGreen">
                {isSaving ? "Saving..." : "Processing..."}
              </p>
            </div>
          )}

          <div className="p-4 border-b border-gray-400 space-y-4 dark:border-darkSurface">
            {/* CC Number Input */}
            <div>
              <label
                htmlFor="creditCardNumber"
                className="block text-sm font-heading text-gray-700 mb-1 dark:text-darkAccentGreen"
              >
                Credit Card Number
              </label>
              <input
                id="creditCardNumber"
                type="text" // Use text to allow formatted input
                inputMode="numeric" // Hint for mobile keyboards
                autoComplete="cc-number"
                className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-primary-main font-mono text-lg dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen" // Use mono font for CC
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
                className="block text-sm font-heading text-gray-700 mb-1 dark:text-darkAccentGreen"
              >
                Expiry (MM/YY)
              </label>
              <input
                id="expiryDate"
                type="text" // Use text to allow formatting like "MM/YY"
                inputMode="numeric"
                autoComplete="cc-exp"
                className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-primary-main font-mono text-lg dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={handleExpiryChange}
                disabled={isProcessing || isSaving}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex flex-wrap gap-2 justify-end border-t border-gray-400 dark:border-darkSurface">
          {/* Process button only shows if card details already exist */}
          {hasExistingCard && (
            <button
              onClick={handleProcessClick}
              disabled={isProcessing || isSaving || !cardNumber || !expiryDate} // Disable if processing or fields are empty
              className="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark transition-colors font-body disabled:opacity-50 disabled:cursor-not-allowed dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
            >
              {isProcessing ? "Processing..." : "Process Payment"}
            </button>
          )}
          {/* Save/Update Button */}
          <button
            onClick={handleSaveOrUpdate}
            disabled={isProcessing || isSaving || !cardNumber || !expiryDate} // Disable if processing or fields are empty
            className="px-4 py-2 bg-success-main text-white rounded hover:bg-success-dark transition-colors font-body disabled:opacity-50 disabled:cursor-not-allowed dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
          >
            {isSaving ? "Saving..." : saveButtonText}
          </button>
          {/* Optional Close/Cancel Button */}
          <button
            onClick={onClose}
            disabled={isProcessing || isSaving}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors font-body disabled:opacity-50 dark:bg-darkSurface dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EntryDialog); // Use memo if props don't change unnecessarily
