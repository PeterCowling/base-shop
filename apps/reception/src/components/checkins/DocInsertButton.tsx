// src/components/checkins/DocInsertButton.tsx
import React, { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import { type CheckInRow } from "../../types/component/CheckinRow";

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
    "h-9 px-2.5 flex items-center gap-1.5 justify-center rounded-md text-primary-fg/100 text-xs font-medium transition-colors focus:outline-none";

  const colorClass = (() => {
    switch (status) {
      case "complete":
        return "bg-success-main/100 hover:opacity-90";
      case "partial":
        return "bg-warning-main/100 hover:opacity-90";
      default:
        return "bg-primary-main/100 hover:opacity-90";
    }
  })();

  const title =
    status === "complete"
      ? "Document data collected — click to review or edit."
      : "Insert occupant document data.";

  /* ---------------------------------------------------------------------- */
  return (
    <Button
      onClick={handleClick}
      className={`${baseClass} ${colorClass}`}
      title={title}
    >
      <FileText size={14} />
      <span>Doc</span>
    </Button>
  );
};

export default memo(DocInsertButton);
