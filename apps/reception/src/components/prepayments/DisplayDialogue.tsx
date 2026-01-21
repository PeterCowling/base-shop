import React from "react";

import MarkAsFailedButton from "./MarkAsFailedButton";
import MarkAsPaidButton from "./MarkAsPaidButton";

export interface PaymentDetails {
  cardNumber?: string;
  expiry?: string;
}

export interface SelectedBooking {
  bookingRef?: string;
  guestId?: string;
  amountToCharge?: number;
  ccCardNumber?: string;
  ccExpiry?: string;
  codes?: number[];
}

type PaymentStatus = "failed" | "paid";

export interface DisplayDialogProps {
  open: boolean;
  details?: PaymentDetails;
  onClose: () => void;
  onEdit: () => void;
  onPaymentStatus: (status: PaymentStatus) => Promise<void>;
  selectedBooking?: SelectedBooking | null;
  /**
   * Callback for displaying a message in a parent component.
   * Currently unused but provided for extensibility.
   */
  setMessage: (msg: string) => void;
  // Must return Promise<void> to be compatible with the button components
  createPaymentTransaction: (
    bookingRef: string,
    guestId: string,
    amount: number
  ) => Promise<void>;
  // Must return Promise<void> to be compatible with the button components
  logActivity: (
    bookingRef: string,
    code: number,
    description: string
  ) => Promise<void>;
}

/**
 * A modal dialog that displays and edits existing payment details for a booking.
 * Also provides actions to mark the payment as failed or paid.
 */
const DisplayDialog: React.FC<DisplayDialogProps> = ({
  open,
  details = {},
  onClose,
  onEdit,
  onPaymentStatus,
  selectedBooking = null,
  setMessage: _setMessage, // Unused prop renamed to satisfy lint rules
  createPaymentTransaction,
  logActivity,
}) => {
  // If no booking is selected or the dialog is not open, do not render.
  if (
    !open ||
    !selectedBooking ||
    !selectedBooking.bookingRef ||
    !selectedBooking.guestId
  ) {
    return null;
  }

  const { cardNumber = "N/A", expiry = "N/A" } = details;
  const {
    bookingRef,
    guestId,
    amountToCharge = 0,
    codes = [],
  } = selectedBooking;

  // Update payment status
  const handlePaymentSuccess = (status: PaymentStatus) => {
    onPaymentStatus(status).catch((err) => {
      console.error("Error updating payment status:", err);
    });
  };

  // Check if we have valid card details
  const hasCard = Boolean(
    selectedBooking.ccCardNumber && selectedBooking.ccExpiry
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-body">
      {/* Dialog container */}
      <div className="bg-white w-96 rounded shadow-lg dark-surface dark:text-darkAccentGreen">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-400 dark:border-darkSurface">
          <h2 className="text-lg font-heading">Existing Payment Details</h2>
          <button
            aria-label="close"
            onClick={onClose}
            className="text-error-main hover:bg-error-light p-2 rounded transition-colors dark:hover:bg-error-light/70"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-4 border-b border-gray-400 dark:border-darkSurface">
          <div className="mb-3">
            <strong className="font-heading">Credit Card Number:</strong>{" "}
            {cardNumber}
          </div>
          <div className="mb-3">
            <strong className="font-heading">Expiry (MM/YY):</strong> {expiry}
          </div>
          <button
            className="px-3 py-1 bg-warning-light text-white rounded hover:bg-warning-main transition-colors font-body dark:bg-warning-main dark:hover:bg-warning-light"
            onClick={onEdit}
          >
            Edit Details
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3 justify-end border-t border-gray-400 dark:border-darkSurface">
          {hasCard ? (
            <MarkAsFailedButton
              bookingRef={bookingRef}
              guestId={guestId}
              existingCodes={codes}
              logActivity={logActivity}
              onSuccess={() => handlePaymentSuccess("failed")}
            />
          ) : (
            <button
              className="px-3 py-1 bg-error-light text-white rounded cursor-not-allowed font-body"
              disabled
            >
              Mark as Failed
            </button>
          )}

          <MarkAsPaidButton
            bookingRef={bookingRef}
            guestId={guestId}
            amount={amountToCharge}
            createPaymentTransaction={createPaymentTransaction}
            logActivity={logActivity}
            onSuccess={() => handlePaymentSuccess("paid")}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(DisplayDialog);
