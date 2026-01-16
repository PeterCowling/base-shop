import { FC, memo, useCallback } from "react";

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
      <button
        type="button"
        onClick={handleCopyBookingRef}
        title="Click to copy booking reference"
        className="relative inline-flex items-center px-4 py-3 text-sm rounded leading-none bg-info-main text-white focus:outline-none min-w-[225px]"
      >
        <i className="fas fa-copy absolute left-2 top-1/2 transform -translate-y-1/2" />
        <span className="ml-8">{bookingRef}</span>
      </button>
    </div>
  );
};

const BookingRef = memo(BookingRefComponent);
BookingRef.displayName = "BookingRef";

export default BookingRef;
