import React, { FC } from "react";

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
 */
const MarkAsFailedButton: FC<MarkAsFailedButtonProps> = ({
  bookingRef: _bookingRef, // Rename to satisfy lint rule for unused variables
  guestId,
  existingCodes,
  logActivity,
  onSuccess,
}) => {
  const handleMarkAsFailed = (): void => {
    let codeToLog = 5;
    let desc = "Payment failed (first attempt)";

    if (existingCodes.includes(5) && !existingCodes.includes(6)) {
      codeToLog = 6;
      desc = "Payment failed (second attempt)";
    } else if (existingCodes.includes(6)) {
      codeToLog = 7;
      desc = "Payment failed (final attempt)";
    }

    logActivity(guestId, codeToLog, desc)
      .then(() => {
        if (onSuccess) onSuccess();
      })
      .catch((error: unknown) => {
        console.error("Error marking as failed:", error);
      });
  };

  return (
    <button
      onClick={handleMarkAsFailed}
      className="px-3 py-1 bg-error-main text-white text-sm rounded hover:bg-error-dark transition-colors font-body dark:bg-darkAccentOrange dark:text-darkSurface dark:hover:bg-darkAccentOrange/80"
    >
      Mark as Failed
    </button>
  );
};

export default React.memo(MarkAsFailedButton);
