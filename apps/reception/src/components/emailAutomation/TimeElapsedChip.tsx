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
    // Booking Created stage: overdue ≥48h = danger, else ok
    if (hoursElapsed >= 48) {
      chipColorClasses = "bg-danger-fg/15 border border-danger-fg text-danger-fg";
    } else {
      chipColorClasses = "bg-primary-soft border border-primary-main/30 text-primary-main";
    }
  } else if (currentCode === 2 || currentCode === 3) {
    // Reminder stages: overdue ≥24h = warning, else ok
    if (hoursElapsed >= 24) {
      chipColorClasses = "bg-warning text-primary-fg";
    } else {
      chipColorClasses = "bg-primary-soft border border-primary-main/30 text-primary-main";
    }
  } else if (currentCode === 4) {
    // Cancelled stage: always danger
    chipColorClasses = "bg-danger-fg/15 border border-danger-fg text-danger-fg";
  } else {
    chipColorClasses = "bg-primary-soft border border-primary-main/30 text-primary-main";
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg font-semibold ${chipColorClasses}`}
    >
      {displayHours}h
    </span>
  );
};

export default TimeElapsedChip;
