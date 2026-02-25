// File: /src/components/common/ConfirmModal.tsx
import { memo, useCallback, useState } from "react";
import {
  CircleHelp,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives";
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
  const Icon = isDanger ? TriangleAlert : CircleHelp;

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
            color="default"
            tone="outline"
            className="min-h-11 min-w-11 flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            color={isDanger ? "danger" : "info"}
            tone="solid"
            className="min-h-11 min-w-11 flex-1"
          >
            {isProcessing ? "Processing..." : confirmLabel}
          </Button>
        </Cluster>
      }
    >
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
          isDanger ? "bg-error-light" : "bg-info-light"
        }`}
      >
        <Icon
          className={`h-6 w-6 ${
            isDanger ? "text-error-main" : "text-info-main"
          }`}
        />
      </div>
      <p
        id="confirm-message"
        className="mt-2 text-center text-sm text-muted-foreground"
      >
        {message}
      </p>
    </SimpleModal>
  );
}

export default memo(ConfirmModal);
