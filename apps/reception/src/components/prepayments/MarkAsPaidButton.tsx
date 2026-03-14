import React, { type FC, useCallback, useState } from "react";

import { Button } from "@acme/design-system/atoms";

import { formatEuro } from "../../utils/format";

interface MarkAsPaidButtonProps {
  bookingRef: string;
  guestId: string;
  amount: number;
  createPaymentTransaction: (
    bookingRef: string,
    guestId: string,
    amount: number
  ) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * MarkAsPaidButton
 * Two-step confirmation: first click shows confirm/cancel, second fires the transaction.
 * Activity code=8 is emitted by the transaction workflow itself.
 */
const MarkAsPaidButton: FC<MarkAsPaidButtonProps> = ({
  bookingRef,
  guestId,
  amount,
  createPaymentTransaction,
  onSuccess,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFirstClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
  };

  const handleConfirm = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsLoading(true);
      setIsConfirming(false);
      try {
        await createPaymentTransaction(bookingRef, guestId, amount);
        if (onSuccess) onSuccess();
      } catch (error: unknown) {
        console.error("Error marking as paid:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [bookingRef, guestId, amount, createPaymentTransaction, onSuccess]
  );

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  if (isConfirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <Button onClick={handleConfirm} color="primary" tone="solid" size="sm">
          ✓
        </Button>
        <Button onClick={handleCancel} color="default" tone="soft" size="sm">
          ✗
        </Button>
      </span>
    );
  }

  return (
    <Button
      onClick={handleFirstClick}
      disabled={isLoading}
      color="primary"
      tone="solid"
      size="sm"
    >
      {isLoading ? "…" : formatEuro(amount)}
    </Button>
  );
};

export default React.memo(MarkAsPaidButton);
