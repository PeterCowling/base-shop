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
  let chipStyle = "bg-info-main text-white";

  if (hoursElapsed !== null && thresholdHours !== null) {
    if (Math.floor(hoursElapsed) >= thresholdHours) {
      chipStyle = "bg-warning-main text-white";
    } else {
      chipStyle = "bg-success-main text-white";
    }
  }

  return (
    <span
      className={`inline-flex w-[100px] items-center justify-center px-4 py-2 text-sm rounded font-semibold ${chipStyle} dark:bg-darkSurface dark:text-darkAccentGreen`}
    >
      {chipLabel}
    </span>
  );
};

export default HoursChip;
