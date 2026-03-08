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
  onSuccess?: () => void;
}

/**
 * MarkAsPaidButton
 * Renders a button that, when clicked, creates a payment transaction.
 * Activity code=8 is emitted by the transaction workflow itself.
 */
const MarkAsPaidButton: FC<MarkAsPaidButtonProps> = ({
  bookingRef,
  guestId,
  amount,
  createPaymentTransaction,
  onSuccess,
}) => {
  const handleMarkAsPaid = (): void => {
    createPaymentTransaction(bookingRef, guestId, amount)
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
