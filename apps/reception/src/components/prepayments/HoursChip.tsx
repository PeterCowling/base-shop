/* src/components/payments/prepayments/HoursChip.tsx */

import React from "react";

export interface HoursChipProps {
  hoursElapsed: number | null;
  thresholdHours: number | null;
}

const HoursChip: React.FC<HoursChipProps> = ({
  hoursElapsed,
  thresholdHours,
}) => {
  const chipLabel =
    hoursElapsed !== null ? `${Math.floor(hoursElapsed)}h` : "N/A";
  let chipStyle = "bg-primary-main text-primary-fg";

  if (hoursElapsed !== null && thresholdHours !== null) {
    if (Math.floor(hoursElapsed) >= thresholdHours) {
      chipStyle = "bg-warning-main text-primary-fg";
    } else {
      chipStyle = "bg-success-main text-primary-fg";
    }
  }

  return (
    <span
      className={`inline-flex w-100px items-center justify-center px-4 py-2 text-sm rounded-lg font-semibold ${chipStyle}`}
    >
      {chipLabel}
    </span>
  );
};

export default HoursChip;
