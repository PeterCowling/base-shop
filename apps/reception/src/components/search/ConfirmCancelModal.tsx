// File: /src/components/search/ConfirmCancelModal.tsx
import { memo, useCallback, useState } from "react";
import { TriangleAlert, X } from "lucide-react";

import { Button } from "@acme/design-system/atoms";
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
        <Button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-1 text-muted-foreground hover:bg-surface-2 hover:text-muted-foreground disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

        {/* Warning icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-light">
          <TriangleAlert className="h-6 w-6 text-error-main" />
        </div>

        {/* Title */}
        <h2 className="mt-4 text-center text-lg font-semibold text-foreground">
          Cancel {bookingCount} Booking{bookingCount !== 1 ? "s" : ""}?
        </h2>

        {/* Description */}
        <p className="mt-2 text-center text-sm text-muted-foreground">
          This action cannot be undone. The following booking
          {bookingCount !== 1 ? "s" : ""} will be marked as cancelled:
        </p>

        {/* Booking refs list */}
        <div className="mt-3 max-h-32 overflow-y-auto rounded-md bg-surface-2 p-2">
          <ul className="space-y-1 text-sm font-mono text-foreground">
            {bookingRefs.slice(0, 10).map((ref) => (
              <li key={ref} className="truncate">
                {ref}
              </li>
            ))}
            {bookingRefs.length > 10 && (
              <li className="text-muted-foreground">
                ...and {bookingRefs.length - 10} more
              </li>
            )}
          </ul>
        </div>

        {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 min-h-11 min-w-11 rounded-md border border-border-2 bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2 disabled:opacity-50"
        >
          Keep Bookings
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="flex-1 min-h-11 min-w-11 rounded-md bg-error-main px-4 py-2 text-sm font-medium text-primary-fg hover:bg-error-dark disabled:opacity-50"
        >
          {isProcessing ? "Cancelling..." : "Yes, Cancel"}
        </Button>
      </div>
    </SimpleModal>
  );
}

export default memo(ConfirmCancelModal);
