import { type FC, memo, useCallback } from "react";

import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

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
    <SimpleModal
      isOpen={true}
      onClose={onClose}
      title="Confirm Deletion"
      maxWidth="max-w-sm"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            color="default"
            tone="soft"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={loading}
            color="danger"
            tone="solid"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      }
    >
      <p className="mb-4">
        Are you sure you want to delete booking{" "}
        <strong>{booking.bookingRef}</strong>?
      </p>
      <p className="text-error-main text-sm mb-6">
        This will remove all guests from the booking.
      </p>
      {Boolean(error) && (
        <p className="text-error-main text-sm mb-4">
          An error occurred while deleting. Please try again.
        </p>
      )}
    </SimpleModal>
  );
};

export default memo(DeleteBookingModal);
