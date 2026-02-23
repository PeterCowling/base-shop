import { memo } from "react";

import { Button } from "@acme/design-system/atoms";

export interface FormActionButtonsProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  className?: string;
  cancelClassName?: string;
  confirmClassName?: string;
  confirmDisabled?: boolean;
  hideCancel?: boolean;
}

export const FormActionButtons = memo(function FormActionButtons({
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  className = "flex gap-2 justify-end mt-4",
  cancelClassName = "px-4 py-2 bg-info-main text-white rounded hover:bg-info-dark dark:bg-darkSurface dark:text-darkAccentOrange",
  confirmClassName = "px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark dark:bg-darkAccentGreen",
  confirmDisabled = false,
  hideCancel = false,
}: FormActionButtonsProps) {
  return (
    <div className={className}>
      {!hideCancel && (
        <Button onClick={onCancel} className={cancelClassName}>
          Cancel
        </Button>
      )}
      <Button
        onClick={onConfirm}
        disabled={confirmDisabled}
        className={`${confirmClassName} ${
          confirmDisabled ? "disabled:opacity-50" : ""
        }`.trim()}
      >
        {confirmText}
      </Button>
    </div>
  );
});

export default FormActionButtons;
