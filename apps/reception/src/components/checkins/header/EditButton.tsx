/* File: src/components/checkins/header/EditButton.tsx */
import { FC, memo, MouseEventHandler } from "react";

/**
 * This component renders a small edit icon button.
 * We keep it slightly smaller than the one in the provided screenshot
 * by adjusting width/height and padding accordingly.
 *
 * How to avoid breaking other code:
 * - Keep the interface typed (no `any`).
 * - Pass all event handlers or styling overrides via props if needed.
 * - This is a standalone, reusable component that can be placed anywhere.
 */

interface EditButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

const EditButton: FC<EditButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center border border-gray-400 rounded-md p-1 hover:bg-gray-100 active:bg-gray-200"
      aria-label="Edit"
    >
      {/* Pencil icon (24x24) so it's smaller but still visible on mobile */}
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.25 
             2.25 0 113.182 3.182L7.5 20.25H3.75v-3.75L16.732 
             3.732z"
        />
      </svg>
    </button>
  );
};

export default memo(EditButton);
