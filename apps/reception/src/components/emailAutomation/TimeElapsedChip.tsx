/* src/components/emailAutomation/TimeElapsedChip.tsx */

import { type FC } from "react";

export interface TimeElapsedChipProps {
  hoursElapsed: number;
  currentCode: number;
}

const TimeElapsedChip: FC<TimeElapsedChipProps> = ({
  hoursElapsed,
  currentCode,
}) => {
  const displayHours = Math.floor(hoursElapsed);

  let chipColorClasses = "";

  if (currentCode === 1) {
    // Booking Created stage
    if (hoursElapsed >= 48) {
      chipColorClasses = "bg-error-main text-white";
    } else {
      chipColorClasses = "bg-primary-main text-white";
    }
  } else if (currentCode === 2) {
    // First Reminder Sent stage
    if (hoursElapsed >= 24) {
      chipColorClasses = "bg-warning-main text-white";
    } else {
      chipColorClasses = "bg-secondary-main text-white";
    }
  } else if (currentCode === 3) {
    // Second Reminder Sent stage
    if (hoursElapsed >= 24) {
      chipColorClasses = "bg-warning-dark text-white";
    } else {
      chipColorClasses = "bg-secondary-main text-white";
    }
  } else if (currentCode === 4) {
    // Cancelled stage
    chipColorClasses = "bg-error-main text-white";
  } else {
    chipColorClasses = "bg-info-main text-white";
  }

  return (
    <span
      className={`inline-flex w-[100px] items-center justify-center px-4 py-2 text-sm rounded font-semibold ${chipColorClasses} dark:bg-darkSurface dark:text-darkAccentGreen`}
    >
      {displayHours}h
    </span>
  );
};

export default TimeElapsedChip;
