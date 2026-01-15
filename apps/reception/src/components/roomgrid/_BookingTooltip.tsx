/** /src/components/roomgrid/BookingTooltip.tsx
 * BookingTooltip:
 * Displays a small tooltip with a subset of booking details: Occupant ID, Booking Reference,
 * First Name, and Last Name.
 *
 * How to avoid breaking other code:
 * - This component is standalone; it only handles the UI for displaying the tooltip.
 * - It uses fixed positioning and pointer-events set to 'none' to avoid interfering with other UI elements.
 */

import type { FC } from "react";
import { memo } from "react";

interface BookingTooltipProps {
  occupantId: string;
  bookingRef: string;
  firstName: string;
  lastName: string;
  position: { x: number; y: number };
}

const BookingTooltip: FC<BookingTooltipProps> = ({
  occupantId,
  bookingRef,
  firstName,
  lastName,
  position,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: position.y + 10, // Offset a bit from the cursor
        left: position.x + 10,
        zIndex: 10000, // Ensure it appears on top
      }}
      className="pointer-events-none rounded bg-black/75 px-2 py-1 text-white dark:bg-darkSurface dark:text-darkAccentGreen"
    >
      <p>
        <strong>
          {firstName} {lastName}
        </strong>
      </p>
      <p>ID: {occupantId}</p>
      <p>Ref: {bookingRef}</p>
    </div>
  );
};

export default memo(BookingTooltip);

