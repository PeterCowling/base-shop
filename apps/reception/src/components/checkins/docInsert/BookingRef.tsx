import { type FC, memo, useCallback } from "react";

import { Button } from "@acme/design-system/atoms";

import { showToast } from "../../../utils/toastUtils";

export interface BookingRefProps {
  bookingRef: string;
}

/**
 * Renders a button to copy the booking reference to the clipboard.
 * Shows a toast message upon success or failure.
 */
const BookingRefComponent: FC<BookingRefProps> = ({ bookingRef }) => {
  const handleCopyBookingRef = useCallback((): void => {
    navigator.clipboard
      .writeText(bookingRef)
      .then(() => {
        showToast(`Booking reference copied: ${bookingRef}`, "success");
      })
      // Renamed 'err' to '_err' to satisfy lint rules for unused parameters
      .catch((_err: unknown) => {
        showToast("Failed to copy booking reference", "error");
      });
  }, [bookingRef]);

  return (
    <div className="flex justify-center mb-6">
      <Button
        type="button"
        onClick={handleCopyBookingRef}
        title="Click to copy booking reference"
        color="info"
        tone="solid"
        className="min-w-225px"
      >
        <i className="fas fa-copy me-2" />
        <span>{bookingRef}</span>
      </Button>
    </div>
  );
};

const BookingRef = memo(BookingRefComponent);
BookingRef.displayName = "BookingRef";

export default BookingRef;
