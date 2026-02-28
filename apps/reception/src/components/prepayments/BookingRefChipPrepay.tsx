// src/components/payments/prepayments/BookingRefChipPrepay.tsx
import { type FC, type KeyboardEvent, memo, useCallback } from "react";
import { Copy } from "lucide-react";

import { showToast } from "../../utils/toastUtils";

export interface BookingRefChipPrepayProps {
  bookingRef: string;
  hasCard: boolean;
}

/**
 * Renders a button to copy the booking reference to the clipboard.
 * Uses toast notifications upon success or failure.
 */
const BookingRefChipPrepayComponent: FC<BookingRefChipPrepayProps> = ({
  bookingRef,
  hasCard,
}) => {
  const chipStyle = hasCard
    ? "bg-primary-soft border border-primary-main/30 text-primary-main"
    : "bg-surface-2 border border-border-strong text-muted-foreground";

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(bookingRef);
      showToast(`Booking reference copied: ${bookingRef}`, "success");
    } catch (err: unknown) {
      console.error("Failed to copy booking reference:", err);
      showToast("Failed to copy booking reference", "error");
    }
  }, [bookingRef]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        void handleCopy();
      }
    },
    [handleCopy]
  );

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => {
        void handleCopy();
      }}
      onKeyDown={handleKeyDown}
      title="Click to copy booking reference"
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg leading-none ${chipStyle} focus:outline-none min-w-48`}
      aria-label={`Copy booking reference ${bookingRef}`}
    >
      <Copy size={14} className="shrink-0" />
      <span>{bookingRef}</span>
    </span>
  );
};

const BookingRefChipPrepay = memo(BookingRefChipPrepayComponent);
BookingRefChipPrepay.displayName = "BookingRefChipPrepay";

export default BookingRefChipPrepay;
