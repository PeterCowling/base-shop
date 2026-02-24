// File: /src/components/common/ConfirmModal.tsx
import { memo, useCallback, useState } from "react";
import {
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";

import { Cluster } from "@acme/design-system/primitives";
import { SimpleModal } from "@acme/ui/molecules";
import { ReceptionButton as Button } from "@acme/ui/operations";

export type ConfirmVariant = "default" | "danger";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Modal for confirming actions (replaces window.confirm).
 * Supports async confirmation handlers with loading state.
 */
function ConfirmModal({
  isOpen,
  title,
  message,
  variant = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
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

  const isDanger = variant === "danger";
  const Icon = isDanger ? ExclamationTriangleIcon : QuestionMarkCircleIcon;

  return (
    <SimpleModal
      isOpen
      onClose={isProcessing ? () => {} : onCancel}
      title={title}
      maxWidth="max-w-sm"
      footer={
        <Cluster gap={3} className="w-full">
          <Button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="min-h-11 min-w-11 flex-1 rounded-md border border-border-2 bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-2 disabled:opacity-50 dark:border-gray-600 dark:bg-darkSurface dark:text-darkAccentGreen dark:hover:bg-surface-3"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`min-h-11 min-w-11 flex-1 rounded-md px-4 py-2 text-sm font-medium text-primary-fg disabled:opacity-50 ${
              isDanger
                ? "bg-error-main hover:bg-red-700"
                : "bg-info-main hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Processing..." : confirmLabel}
          </Button>
        </Cluster>
      }
    >
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
          isDanger ? "bg-error-light dark:bg-red-900/30" : "bg-info-light dark:bg-blue-900/30"
        }`}
      >
        <Icon
          className={`h-6 w-6 ${
            isDanger ? "text-error-main dark:text-red-400" : "text-info-main dark:text-blue-400"
          }`}
        />
      </div>
      <p
        id="confirm-message"
        className="mt-2 text-center text-sm text-muted-foreground dark:text-muted-foreground"
      >
        {message}
      </p>
    </SimpleModal>
  );
}

export default memo(ConfirmModal);
