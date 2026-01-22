// File: /src/components/search/ConfirmCancelModal.tsx
import { memo, useCallback, useState } from "react";
import { ExclamationTriangleIcon,XMarkIcon } from "@heroicons/react/24/solid";

import { SimpleModal } from "@acme/ui/molecules";

interface ConfirmCancelModalProps {
  isOpen: boolean;
  bookingCount: number;
  bookingRefs: string[];
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Modal for confirming bulk cancellation of bookings.
 * Replaces window.confirm with a proper UI component.
 */
function ConfirmCancelModal({
  isOpen,
  bookingCount,
  bookingRefs,
  onConfirm,
  onCancel,
}: ConfirmCancelModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  }, [onConfirm]);

  if (!isOpen) return null;

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-md"
      showCloseButton
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-darkSurface dark:text-darkAccentGreen"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

        {/* Warning icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h2 className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-darkAccentGreen">
          Cancel {bookingCount} Booking{bookingCount !== 1 ? "s" : ""}?
        </h2>

        {/* Description */}
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          This action cannot be undone. The following booking
          {bookingCount !== 1 ? "s" : ""} will be marked as cancelled:
        </p>

        {/* Booking refs list */}
        <div className="mt-3 max-h-32 overflow-y-auto rounded-md bg-gray-50 p-2 dark:bg-gray-800">
          <ul className="space-y-1 text-sm font-mono text-gray-700 dark:text-gray-300">
            {bookingRefs.slice(0, 10).map((ref) => (
              <li key={ref} className="truncate">
                {ref}
              </li>
            ))}
            {bookingRefs.length > 10 && (
              <li className="text-gray-500 dark:text-gray-400">
                ...and {bookingRefs.length - 10} more
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 min-h-11 min-w-11 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-darkSurface dark:text-darkAccentGreen dark:hover:bg-gray-700"
        >
          Keep Bookings
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="flex-1 min-h-11 min-w-11 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isProcessing ? "Cancelling..." : "Yes, Cancel"}
        </button>
      </div>
    </SimpleModal>
  );
}

export default memo(ConfirmCancelModal);
