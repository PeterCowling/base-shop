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

  let chipStyle = "bg-surface-2 border border-border-strong text-muted-foreground";

  if (hoursElapsed !== null && thresholdHours !== null) {
    if (Math.floor(hoursElapsed) >= thresholdHours) {
      chipStyle = "bg-warning text-primary-fg";
    } else {
      chipStyle = "bg-primary-soft border border-primary-main/30 text-primary-main";
    }
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg font-semibold ${chipStyle}`}
    >
      {chipLabel}
    </span>
  );
};

export default HoursChip;
