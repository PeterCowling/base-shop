/* src/components/payments/prepayments/CheckInDateChip.tsx */

import dayjs from "dayjs";
import React from "react";

export interface CheckInDateChipProps {
  checkInDate?: string;
}

const CheckInDateChip: React.FC<CheckInDateChipProps> = ({ checkInDate }) => {
  let isUpcoming = false;
  let formattedCheckInDate = "N/A";

  if (checkInDate) {
    const today = dayjs();
    const checkIn = dayjs(checkInDate);
    const diffDays = checkIn.diff(today, "day");
    isUpcoming = diffDays >= 0 && diffDays <= 7;
    formattedCheckInDate = checkIn.format("MMM D, YYYY");
  }

  const chipStyle = isUpcoming
    ? "bg-warning-main text-white"
    : "bg-info-main text-white";

  return (
    <span
      className={`inline-flex w-[140px] items-center justify-center px-4 py-2 text-sm font-semibold rounded ${chipStyle} dark:bg-darkSurface dark:text-darkAccentGreen`}
    >
      {formattedCheckInDate}
    </span>
  );
};

export default CheckInDateChip;
