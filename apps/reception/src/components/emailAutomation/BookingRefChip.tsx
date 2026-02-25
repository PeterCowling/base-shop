// src/components/emailAutomation/BookingRefChip.tsx
import { type FC, memo, useCallback } from "react";
import { Copy } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import { showToast } from "../../utils/toastUtils";

/**
 * Tracks the last booking reference copied (to prevent repeated copies of the same reference).
 */
let lastCopiedRef: string | null = null;

/**
 * Ensures only one "copied" toast is visible at a time.
 */
let isCopyToastActive = false;

export interface BookingRefChipProps {
  bookingRef: string;
}

/**
 * Renders a button to copy the booking reference to the clipboard.
 * Prevents consecutive copies of the same reference.
 * Never shows more than one "copied" toast at the same time.
 */
const BookingRefChipComponent: FC<BookingRefChipProps> = ({ bookingRef }) => {
  const handleCopyBookingRef = useCallback((): void => {
    // Skip if this reference was just copied, or if a toast is already active
    if (bookingRef === lastCopiedRef || isCopyToastActive) {
      return;
    }

    navigator.clipboard
      .writeText(bookingRef)
      .then(() => {
        // Mark toast as active
        isCopyToastActive = true;
        lastCopiedRef = bookingRef;

        showToast(`Booking reference copied: ${bookingRef}`, "success");

        // Allow future "copied" toasts after a delay
        setTimeout(() => {
          isCopyToastActive = false;
        }, 3000);
      })
      .catch((err: unknown) => {
        console.error("Failed to copy booking reference:", err);
        showToast("Failed to copy booking reference", "error");
      });
  }, [bookingRef]);

  return (
    <Button
      type="button"
      onClick={handleCopyBookingRef}
      color="primary"
      tone="solid"
      size="sm"
      className="cursor-pointer min-w-225px"
      aria-label={`Copy booking reference ${bookingRef}`}
    >
      <Copy size={14} className="shrink-0" />
      <span>{bookingRef}</span>
    </Button>
  );
};

const BookingRefChip = memo(BookingRefChipComponent);
BookingRefChip.displayName = "BookingRefChip";

export default BookingRefChip;
