import React, { type FC } from "react";

import { Button } from "@acme/design-system/atoms";

interface MarkAsPaidButtonProps {
  bookingRef: string;
  guestId: string;
  amount: number;
  createPaymentTransaction: (
    bookingRef: string,
    guestId: string,
    amount: number
  ) => Promise<void>; // strictly returning Promise<void>
  logActivity: (
    occupantId: string,
    code: number,
    description: string
  ) => Promise<void>; // strictly returning Promise<void>
  onSuccess?: () => void;
}

/**
 * MarkAsPaidButton
 * Renders a button that, when clicked, creates a payment transaction
 * and logs an activity (code=8). This triggers the backend email.
 */
const MarkAsPaidButton: FC<MarkAsPaidButtonProps> = ({
  bookingRef,
  guestId,
  amount,
  createPaymentTransaction,
  logActivity,
  onSuccess,
}) => {
  const handleMarkAsPaid = (): void => {
    createPaymentTransaction(bookingRef, guestId, amount)
      .then(() => logActivity(guestId, 8, "Prepayment completed"))
      .then(() => {
        if (onSuccess) onSuccess();
      })
      .catch((error: unknown) => {
        console.error("Error marking as paid:", error);
      });
  };

  return (
    <Button
      onClick={handleMarkAsPaid}
      color="primary"
      tone="solid"
      size="sm"
    >
      €{amount.toFixed(2)}
    </Button>
  );
};

export default React.memo(MarkAsPaidButton);
