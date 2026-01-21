// File: /src/components/checkins/DeleteConfirmationModal.tsx

import { FC, memo, useCallback } from "react";

import useDeleteGuestFromBooking from "../../../hooks/mutations/useDeleteGuestFromBooking";
import { CheckInRow } from "../../../types/component/CheckinRow";

/**
 * DeleteConfirmationModal:
 * Displays a confirmation prompt asking the user if they want to delete a guest
 * from the booking. On confirmation, calls a Firebase-based deletion function.
 *
 * How to avoid breaking other code:
 * - This component is standalone; it only handles the UI for confirming deletion.
 * - Use the custom hook `useDeleteGuestFromBooking` to mutate data.
 * - Accept occupant's booking object and onClose callback as props.
 */
interface DeleteConfirmationModalProps {
  booking: CheckInRow;
  onClose: () => void;
}

const DeleteConfirmationModal: FC<DeleteConfirmationModalProps> = ({
  booking,
  onClose,
}) => {
  // The revised hook returns { deleteGuest, loading, error }
  const { deleteGuest, loading, error } = useDeleteGuestFromBooking();

  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteGuest({
        bookingRef: booking.bookingRef,
        occupantId: booking.occupantId,
      });
      onClose();
    } catch (err) {
      console.error("[DeleteConfirmationModal] Deletion error:", err);
      // Optionally handle or display error here
    }
  }, [booking.bookingRef, booking.occupantId, deleteGuest, onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white w-full max-w-sm p-6 rounded shadow-lg dark:bg-darkSurface dark:text-darkAccentGreen">
          <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
          <p className="mb-4">
            Are you sure you want to delete{" "}
            <strong>
              {booking.firstName} {booking.lastName}
            </strong>{" "}
            from booking <strong>{booking.bookingRef}</strong>?
          </p>
          <p className="text-red-600 text-sm mb-6">
            This action cannot be undone.
          </p>
          {Boolean(error) && (
            <p className="text-red-500 text-sm mb-4">
              An error occurred while deleting. Please try again.
            </p>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-darkSurface dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={loading}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(DeleteConfirmationModal);
