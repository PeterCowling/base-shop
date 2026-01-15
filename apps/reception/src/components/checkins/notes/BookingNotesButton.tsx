import { faNoteSticky } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useState } from "react";

import BookingNotesModal from "./BookingNotesModal";

interface Props {
  bookingRef: string;
}

function BookingNotesButton({ bookingRef }: Props) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="relative flex items-center dark:text-darkAccentGreen">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[55px] px-4 bg-primary-main text-white rounded-md hover:bg-primary-dark transition-colors dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
        title="View or add notes"
      >
        <FontAwesomeIcon icon={faNoteSticky} />
      </button>
      {open && (
        <BookingNotesModal
          bookingRef={bookingRef}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export default memo(BookingNotesButton);
