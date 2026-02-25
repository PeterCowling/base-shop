/* File: src/components/checkins/header/DeleteButton.tsx */
import { type FC, memo, type MouseEventHandler } from "react";

import { Button } from "@acme/design-system/atoms";

/**
 * This component renders a small delete icon button.
 * The styling is consistent with the EditButton, but with a red theme.
 *
 * How to avoid breaking other code:
 * - Keep the interface strictly typed.
 * - Pass all event handlers or styling overrides via props.
 * - This is a standalone, reusable component.
 */
interface DeleteButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

const DeleteButton: FC<DeleteButtonProps> = ({ onClick, disabled }) => {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center border border-error-main rounded-md p-1 hover:bg-error-light active:bg-error-light"
      aria-label="Delete"
    >
      {/* Trash icon (24x24) */}
      <svg
        className="w-6 h-6 text-error-main"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22"
        />
      </svg>
    </Button>
  );
};

export default memo(DeleteButton);
