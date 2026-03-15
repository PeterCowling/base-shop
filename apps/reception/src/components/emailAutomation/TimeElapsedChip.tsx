/* src/components/emailAutomation/TimeElapsedChip.tsx */

import { type FC } from "react";

const CODE1_OVERDUE_HOURS = 48;
const REMINDER_OVERDUE_HOURS = 24;

const CHIP_OK = "bg-primary-soft border border-primary-main/30 text-primary-main";
const CHIP_DANGER = "bg-error-main/10 border border-error-main text-error-main";
const CHIP_WARNING = "bg-warning text-warning-fg";

export interface TimeElapsedChipProps {
  hoursElapsed: number;
  currentCode: number;
}

const TimeElapsedChip: FC<TimeElapsedChipProps> = ({
  hoursElapsed,
  currentCode,
}) => {
  let chipColorClasses: string;

  if (currentCode === 1) {
    // Booking Created stage: overdue ≥48h = danger, else ok
    chipColorClasses = hoursElapsed >= CODE1_OVERDUE_HOURS ? CHIP_DANGER : CHIP_OK;
  } else if (currentCode === 2 || currentCode === 3) {
    // Reminder stages: overdue ≥24h = warning, else ok
    chipColorClasses = hoursElapsed >= REMINDER_OVERDUE_HOURS ? CHIP_WARNING : CHIP_OK;
  } else if (currentCode === 4) {
    // Cancelled stage: always danger
    chipColorClasses = CHIP_DANGER;
  } else {
    chipColorClasses = CHIP_OK;
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg font-semibold ${chipColorClasses}`}
    >
      {Math.floor(hoursElapsed)}h
    </span>
  );
};

export default TimeElapsedChip;
