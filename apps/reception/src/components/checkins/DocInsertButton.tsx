// src/components/checkins/DocInsertButton.tsx
import React, { memo, useCallback } from "react";
import { useRouter } from "next/navigation";

import { CheckInRow } from "../../types/component/CheckinRow";

/**
 * Determine whether the occupant’s document data is
 * "none", "partial", or "complete".
 */
function getDocProgress(booking: CheckInRow): "none" | "partial" | "complete" {
  const {
    docNumber,
    citizenship,
    placeOfBirth,
    dateOfBirth, // { dd, mm, yyyy }
  } = booking;

  let filledCount = 0;
  const totalRequired = 4;

  if (docNumber?.trim()) filledCount += 1;
  if (citizenship?.trim()) filledCount += 1;
  if (placeOfBirth?.trim()) filledCount += 1;
  if (
    dateOfBirth?.dd?.trim() &&
    dateOfBirth.mm?.trim() &&
    dateOfBirth.yyyy?.trim()
  ) {
    filledCount += 1;
  }

  if (filledCount === 0) return "none";
  if (filledCount === totalRequired) return "complete";
  return "partial";
}

interface DocInsertButtonProps {
  booking: CheckInRow;
  selectedDate: string;
}

const DocInsertButton: React.FC<DocInsertButtonProps> = ({
  booking,
  selectedDate,
}) => {
  const router = useRouter();

  const status = getDocProgress(booking);

  const handleClick = useCallback((): void => {
    const params = new URLSearchParams({
      bookingRef: booking.bookingRef,
      occupantId: booking.occupantId,
      selectedDate,
    });
    router.push(`/doc-insert?${params.toString()}`);
  }, [router, booking.bookingRef, booking.occupantId, selectedDate]);

  /* ---------- styling --------------------------------------------------- */
  const baseClass =
    "min-h-[55px] px-4 flex items-center justify-center rounded-md text-white transition-colors focus:outline-none";

  const colorClass = (() => {
    switch (status) {
      case "complete":
        return "bg-success-main hover:bg-success-dark dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80";
      case "partial":
        return "bg-warning-main hover:bg-warning-dark dark:bg-darkAccentOrange dark:text-darkBg dark:hover:bg-darkAccentOrange/80";
      default:
        return "bg-primary-main hover:bg-primary-dark dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80";
    }
  })();

  const title =
    status === "complete"
      ? "Document data collected — click to review or edit."
      : "Insert occupant document data.";

  /* ---------------------------------------------------------------------- */
  return (
    <button
      onClick={handleClick}
      className={`${baseClass} ${colorClass}`}
      title={title}
    >
      <i className="fas fa-passport" />
      <span className="ml-2">Doc</span>
    </button>
  );
};

export default memo(DocInsertButton);
