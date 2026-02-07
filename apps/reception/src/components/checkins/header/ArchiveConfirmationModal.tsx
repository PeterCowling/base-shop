import { type FC, memo, useCallback, useEffect } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white w-full max-w-sm p-6 rounded shadow-lg dark:bg-darkSurface dark:text-darkAccentGreen">
        <>
          <h2 className="text-lg font-semibold mb-4">Archive Bookings</h2>
          <p className="mb-4">
            Are you sure you want to archive the following bookings? Only the 50
            oldest bookings are archived at once.{" "}
          </p>
          {bookingsLoading && (
            <p className="mb-4 italic text-gray-600 dark:text-darkAccentGreen">Loading bookings...</p>
          )}
          {bookingsError && !bookingsLoading && (
            <p className="text-red-500 text-sm mb-4">
              Failed to load booking list.
            </p>
          )}
          {!bookingsLoading && !bookingsError && bookings.length > 0 && (
            <ul className="mb-4 max-h-40 overflow-y-auto text-sm space-y-1">
              {bookings.map((b) => (
                <li key={b.bookingRef} className="flex justify-between">
                  <span>{b.bookingRef}</span>
                  <span className="text-gray-600 dark:text-darkAccentGreen">{b.checkOutDate}</span>
                </li>
              ))}
            </ul>
          )}
          {Boolean(error) && (
            <p className="text-red-500 text-sm mb-4">
              An error occurred while archiving. Please try again.
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
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 rounded bg-primary-main hover:bg-primary-dark text-white dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
            >
              {loading ? "Archiving..." : "Archive"}
            </button>
          </div>
        </>
      </div>
    </div>
  );
};

export default memo(ArchiveConfirmationModal);
