import React, { type FC, useCallback, useState } from "react";

import { Button } from "@acme/design-system/atoms";

import { getNextPaymentFailureCode } from "./PrepaymentsContainer";

const FAILURE_DESCRIPTIONS: Record<number, string> = {
  5: "Payment failed (first attempt)",
  6: "Payment failed (second attempt)",
  7: "Payment failed (final attempt)",
};

interface MarkAsFailedButtonProps {
  /**
   * Booking reference (not currently used in this component).
   */
  bookingRef: string;
  guestId: string;
  existingCodes: number[];
  logActivity: (
    occupantId: string,
    code: number,
    description: string
  ) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * MarkAsFailedButton:
 * Logs code=5,6,7 to reflect "Payment failed" attempts, triggering email.
 * Returns null when code 7 already exists (terminal state — no further action possible).
 * Two-step confirmation: first click shows confirm/cancel, second fires logActivity.
 */
const MarkAsFailedButton: FC<MarkAsFailedButtonProps> = ({
  bookingRef: _bookingRef,
  guestId,
  existingCodes,
  logActivity,
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
      const codeToLog = getNextPaymentFailureCode(existingCodes);
      const desc = FAILURE_DESCRIPTIONS[codeToLog] ?? "Payment failed";
      setIsLoading(true);
      setIsConfirming(false);
      try {
        await logActivity(guestId, codeToLog, desc);
        if (onSuccess) onSuccess();
      } catch (error: unknown) {
        console.error("Error marking as failed:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [guestId, existingCodes, logActivity, onSuccess]
  );

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
  };

  // Terminal guard: code 7 = final failure recorded, no further action possible
  if (existingCodes.includes(7)) {
    return null;
  }

  if (isConfirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <Button onClick={handleConfirm} color="danger" tone="solid" size="sm">
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
      color="danger"
      tone="solid"
      size="sm"
    >
      {isLoading ? "…" : "Mark as Failed"}
    </Button>
  );
};

export default React.memo(MarkAsFailedButton);
