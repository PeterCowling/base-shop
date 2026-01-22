// src/components/emailAutomation/BookingRefChip.tsx
import { type FC, memo, useCallback } from "react";

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
    <button
      type="button"
      onClick={handleCopyBookingRef}
      className="relative cursor-pointer inline-flex items-center justify-center bg-info-main text-white pr-4 py-2 text-sm rounded focus:outline-none min-w-[225px] dark:bg-darkSurface dark:text-darkAccentGreen"
      aria-label={`Copy booking reference ${bookingRef}`}
    >
      <i className="fas fa-copy absolute left-2 top-1/2 transform -translate-y-1/2"></i>
      <span className="ms-8">{bookingRef}</span>
    </button>
  );
};

const BookingRefChip = memo(BookingRefChipComponent);
BookingRefChip.displayName = "BookingRefChip";

export default BookingRefChip;
