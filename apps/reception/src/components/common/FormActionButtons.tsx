import { memo } from "react";

import type { ButtonProps } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/atoms";

export interface FormActionButtonsProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  className?: string;
  /** Semantic colour for the cancel button. */
  cancelColor?: ButtonProps["color"];
  /** Semantic colour for the confirm button. */
  confirmColor?: ButtonProps["color"];
  confirmDisabled?: boolean;
  hideCancel?: boolean;
}

export const FormActionButtons = memo(function FormActionButtons({
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  className = "flex gap-2 justify-end mt-4",
  cancelColor = "default",
  confirmColor = "primary",
  confirmDisabled = false,
  hideCancel = false,
}: FormActionButtonsProps) {
  return (
    <div className={className}>
      {!hideCancel && (
        <Button onClick={onCancel} color={cancelColor} tone="outline">
          Cancel
        </Button>
      )}
      <Button
        onClick={onConfirm}
        disabled={confirmDisabled}
        color={confirmColor}
        tone="solid"
      >
        {confirmText}
      </Button>
    </div>
  );
});

export default FormActionButtons;
