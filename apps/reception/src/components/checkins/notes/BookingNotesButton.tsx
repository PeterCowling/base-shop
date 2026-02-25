import { memo, useState } from "react";
import { StickyNote } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import BookingNotesModal from "./BookingNotesModal";

interface Props {
  bookingRef: string;
}

function BookingNotesButton({ bookingRef }: Props) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className="relative flex items-center">
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-55px px-4 bg-primary-main text-primary-fg rounded-md hover:bg-primary-dark transition-colors"
        title="View or add notes"
      >
        <StickyNote size={20} />
      </Button>
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
