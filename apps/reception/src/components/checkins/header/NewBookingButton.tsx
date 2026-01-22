// src/components/bookings/header/NewBookingButton.tsx

import { type FC, memo, type MouseEventHandler } from "react";

/**
 * This component renders a small "new booking" icon button.
 * It matches the size and style of other header action buttons.
 *
 * How to avoid breaking other code:
 * - Keep the interface fully typed (no `any`).
 * - Pass all event handlers via props.
 * - This is a standalone, reusable component.
 */
interface NewBookingButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

const NewBookingButton: FC<NewBookingButtonProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center border border-gray-400 rounded-md p-1 hover:bg-gray-100 active:bg-gray-200"
      aria-label="New booking"
    >
      {/* Plus icon (24x24) for "new booking" */}
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
};

export default memo(NewBookingButton);
