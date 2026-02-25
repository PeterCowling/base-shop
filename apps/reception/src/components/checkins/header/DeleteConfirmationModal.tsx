// File: /src/components/checkins/DeleteConfirmationModal.tsx

import { type FC, memo, useCallback } from "react";

import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

import useDeleteGuestFromBooking from "../../../hooks/mutations/useDeleteGuestFromBooking";
import { type CheckInRow } from "../../../types/component/CheckinRow";

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
    <SimpleModal
      isOpen={true}
      onClose={onClose}
      title="Confirm Deletion"
      maxWidth="max-w-sm"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            className="px-4 py-2 rounded bg-surface-3 hover:bg-surface-3 text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={loading}
            className="px-4 py-2 rounded bg-error-main hover:bg-error-dark text-primary-fg"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      }
    >
      <p className="mb-4">
        Are you sure you want to delete{" "}
        <strong>
          {booking.firstName} {booking.lastName}
        </strong>{" "}
        from booking <strong>{booking.bookingRef}</strong>?
      </p>
      <p className="text-error-main text-sm mb-6">
        This action cannot be undone.
      </p>
      {Boolean(error) && (
        <p className="text-error-main text-sm mb-4">
          An error occurred while deleting. Please try again.
        </p>
      )}
    </SimpleModal>
  );
};

export default memo(DeleteConfirmationModal);
