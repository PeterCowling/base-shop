import { type FC, memo, useCallback, useEffect } from "react";

import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

import useArchiveCheckedOutGuests from "../../../hooks/mutations/useArchiveCheckedOutGuests";
import useArchiveEligibleBookings from "../../../hooks/mutations/useArchiveEligibleBookings";

interface ArchiveConfirmationModalProps {
  onClose: () => void;
  /** Callback to refresh archive eligible count */
  onArchiveComplete: () => void;
}

const ArchiveConfirmationModal: FC<ArchiveConfirmationModalProps> = ({
  onClose,
  onArchiveComplete,
}) => {
  const { archiveCheckedOutGuests, loading, error } =
    useArchiveCheckedOutGuests();
  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refresh: refreshBookings,
  } = useArchiveEligibleBookings();

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const handleConfirm = useCallback(async () => {
    try {
      await archiveCheckedOutGuests();
      refreshBookings();
      onArchiveComplete();
      onClose();
    } catch (err) {
      console.error("[ArchiveConfirmationModal] Archive error:", err);
    }
  }, [archiveCheckedOutGuests, refreshBookings, onArchiveComplete, onClose]);

  return (
    <SimpleModal
      isOpen={true}
      onClose={onClose}
      title="Archive Bookings"
      maxWidth="max-w-sm"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-3 hover:bg-surface-3 text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-main hover:bg-primary-dark text-primary-fg"
          >
            {loading ? "Archiving..." : "Archive"}
          </Button>
        </div>
      }
    >
      <p className="mb-4">
        Are you sure you want to archive the following bookings? Only the 50
        oldest bookings are archived at once.{" "}
      </p>
      {bookingsLoading && (
        <p className="mb-4 italic text-muted-foreground">Loading bookings...</p>
      )}
      {bookingsError && !bookingsLoading && (
        <p className="text-error-main text-sm mb-4">
          Failed to load booking list.
        </p>
      )}
      {!bookingsLoading && !bookingsError && bookings.length > 0 && (
        <ul className="mb-4 max-h-40 overflow-y-auto text-sm space-y-1">
          {bookings.map((b) => (
            <li key={b.bookingRef} className="flex justify-between">
              <span>{b.bookingRef}</span>
              <span className="text-muted-foreground">{b.checkOutDate}</span>
            </li>
          ))}
        </ul>
      )}
      {Boolean(error) && (
        <p className="text-error-main text-sm mb-4">
          An error occurred while archiving. Please try again.
        </p>
      )}
    </SimpleModal>
  );
};

export default memo(ArchiveConfirmationModal);
