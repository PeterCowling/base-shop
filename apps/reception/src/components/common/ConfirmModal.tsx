// File: /src/components/common/ConfirmModal.tsx
import { memo, useCallback, useState } from "react";
import {
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";
import { Cluster } from "@acme/ui/components/atoms/primitives";
import { SimpleModal } from "@acme/ui/molecules";

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
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="min-h-11 min-w-11 flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-darkSurface dark:text-darkAccentGreen dark:hover:bg-gray-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`min-h-11 min-w-11 flex-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Processing..." : confirmLabel}
          </button>
        </Cluster>
      }
    >
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
          isDanger ? "bg-red-100 dark:bg-red-900/30" : "bg-blue-100 dark:bg-blue-900/30"
        }`}
      >
        <Icon
          className={`h-6 w-6 ${
            isDanger ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
          }`}
        />
      </div>
      <p
        id="confirm-message"
        className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
      >
        {message}
      </p>
    </SimpleModal>
  );
}

export default memo(ConfirmModal);
