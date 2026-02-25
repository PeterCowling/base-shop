import React from "react";

import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

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
  // If no booking is selected, do not render (SimpleModal handles open/closed state).
  if (!selectedBooking || !selectedBooking.bookingRef || !selectedBooking.guestId) {
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
    <SimpleModal
      isOpen={open}
      onClose={onClose}
      title="Existing Payment Details"
      maxWidth="max-w-sm"
      className="font-body"
      footer={
        <div className="flex gap-3 justify-end">
          {hasCard ? (
            <MarkAsFailedButton
              bookingRef={bookingRef}
              guestId={guestId}
              existingCodes={codes}
              logActivity={logActivity}
              onSuccess={() => handlePaymentSuccess("failed")}
            />
          ) : (
            <Button
              color="danger"
              tone="soft"
              size="sm"
              disabled
            >
              Mark as Failed
            </Button>
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
      }
    >
      <div className="mb-3">
        <strong className="font-heading">Credit Card Number:</strong>{" "}
        {cardNumber}
      </div>
      <div className="mb-3">
        <strong className="font-heading">Expiry (MM/YY):</strong> {expiry}
      </div>
      <Button
        onClick={onEdit}
        color="warning"
        tone="soft"
        size="sm"
      >
        Edit Details
      </Button>
    </SimpleModal>
  );
};

export default React.memo(DisplayDialog);
