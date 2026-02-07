/* File: src/components/checkins/BookingRow.tsx */

import React, { type FC, memo, useCallback, useMemo, useState } from "react";

import useBookingNotes from "../../hooks/data/useBookingNotes";
import useKeycardInfo from "../../hooks/data/useKeycardInfo";
import useRoomAllocation from "../../hooks/utilities/useRoomAllocation";
import { type CheckInRow } from "../../types/component/CheckinRow";

import BookingRowView from "./view/BookingRow";

/**
 * Props for BookingRow:
 * @param booking       Full checkin data for a single occupant
 * @param selectedDate  The date for which we are viewing/managing checkins
 * @param onRowClick    Optional callback for when the row is clicked
 */
interface BookingRowProps {
  booking: CheckInRow;
  selectedDate: string;
  allGuests: CheckInRow[];
  onRowClick?: (booking: CheckInRow) => void;
}

/**
 * BookingRow: Renders a table row showing occupant info + room allocation
 * and related payment buttons.
 *
 * It listens for changes to the occupant's allocated room. If the user
 * confirms a change, we trigger our custom "allocateRoomIfAllowed" hook,
 * which updates both:
 *   1) The occupant's allocated room in /guestByRoom
 *   2) The occupant's assignment in /roomsByDate
 *
 * How to avoid breaking other code:
 * - Do not alter the references to occupant's data or bookingRef.
 * - Pass row click handlers from props to ensure the parent can control logic.
 */
const BookingRow: FC<BookingRowProps> = ({
  booking,
  selectedDate,
  allGuests,
  onRowClick,
}) => {
  const { draftValue, setDraftValue, handleBlur, handleKeyDown } =
    useRoomAllocation({ booking, selectedDate, allGuests });

  const { hasKeycard, depositType } = useKeycardInfo(
    booking.bookingRef,
    booking.occupantId
  );

  /* -----------------------------------------------------------------------
   * Booking notes state
   * --------------------------------------------------------------------- */
  const { notes } = useBookingNotes(
    booking.isFirstForBooking ? booking.bookingRef : ""
  );
  const [notesOpen, setNotesOpen] = useState(false);
  const sortedNotes = useMemo(() => {
    return Object.values(notes).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
  }, [notes]);
  const notesText = useMemo(() => {
    if (sortedNotes.length === 0) return undefined;
    return sortedNotes.map((n) => n.text).join("; ");
  }, [sortedNotes]);

  const handleNameDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation();
      if (booking.isFirstForBooking) {
        setNotesOpen(true);
      }
    },
    [booking.isFirstForBooking]
  );

  /**
   * Row click handler; only triggers if onRowClick is provided
   */
  const handleRowClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(booking);
    }
  }, [onRowClick, booking]);

  return (
    <BookingRowView
      booking={booking}
      selectedDate={selectedDate}
      draftValue={draftValue}
      onDraftChange={setDraftValue}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onRowClick={onRowClick ? handleRowClick : undefined}
      onNameDoubleClick={handleNameDoubleClick}
      hasKeycard={hasKeycard}
      depositType={depositType}
      notesText={notesText}
      notesOpen={notesOpen}
      closeNotes={() => setNotesOpen(false)}
    />
  );
};

export default memo(BookingRow);
