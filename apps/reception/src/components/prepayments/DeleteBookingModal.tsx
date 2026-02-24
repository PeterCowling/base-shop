import { type FC, memo, useCallback } from "react";

import { ReceptionButton as Button } from "@acme/ui/operations";

import { type PrepaymentData } from "../../hooks/client/checkin/usePrepaymentData";
import useDeleteBooking from "../../hooks/mutations/useDeleteBooking";

interface DeleteBookingModalProps {
  booking: PrepaymentData;
  onClose: () => void;
}

const DeleteBookingModal: FC<DeleteBookingModalProps> = ({
  booking,
  onClose,
}) => {
  const { deleteBooking, loading, error } = useDeleteBooking();

  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteBooking(booking.bookingRef);
      onClose();
    } catch (err) {
      console.error("[DeleteBookingModal] Deletion error:", err);
    }
  }, [booking.bookingRef, deleteBooking, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground bg-opacity-50 p-4">
      <div className="bg-surface w-full max-w-sm p-6 rounded shadow-lg dark-surface dark:text-darkAccentGreen">
        <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
        <p className="mb-4">
          Are you sure you want to delete booking{" "}
          <strong>{booking.bookingRef}</strong>?
        </p>
        <p className="text-error-main text-sm mb-6 dark:text-darkAccentOrange">
          This will remove all guests from the booking.
        </p>
        {Boolean(error) && (
          <p className="text-error-main text-sm mb-4 dark:text-darkAccentOrange">
            An error occurred while deleting. Please try again.
          </p>
        )}
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            className="px-4 py-2 rounded bg-surface-3 hover:bg-surface-3 text-foreground dark:bg-darkSurface dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={loading}
            className="px-4 py-2 rounded bg-error-main hover:bg-red-700 text-primary-fg dark:bg-darkAccentOrange dark:text-darkSurface dark:hover:bg-darkAccentOrange/80"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default memo(DeleteBookingModal);
