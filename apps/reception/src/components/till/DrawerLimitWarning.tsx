import type { FC } from "react";

import { Button } from "@acme/design-system/atoms";

interface DrawerLimitWarningProps {
  show: boolean;
  onLift: () => void;
}

const DrawerLimitWarning: FC<DrawerLimitWarningProps> = ({ show, onLift }) => {
  if (!show) return null;
  return (
    <div className="text-warning-main text-lg font-semibold flex items-center gap-2 self-end text-end sm:ms-auto dark:text-darkAccentGreen">
      Cash exceeds drawer limit.
      <Button
        onClick={onLift}
        className="underline text-info-main dark:text-darkAccentOrange"
      >
        Lift
      </Button>
      as soon as possible, and before closing.
    </div>
  );
};

export default DrawerLimitWarning;
