// src/components/bookings/header/NewBookingButton.tsx

import { type FC, memo, type MouseEventHandler } from "react";

import { Button } from "@acme/design-system/atoms";

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
    <Button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center border border-border-2 rounded-md p-1 hover:bg-surface-2 active:bg-surface-3"
      aria-label="New booking"
    >
      {/* Plus icon (24x24) for "new booking" */}
      <svg
        className="w-6 h-6 text-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </Button>
  );
};

export default memo(NewBookingButton);
