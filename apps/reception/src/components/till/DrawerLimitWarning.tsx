import type { FC } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

interface DrawerLimitWarningProps {
  show: boolean;
  onLift: () => void;
}

const DrawerLimitWarning: FC<DrawerLimitWarningProps> = ({ show, onLift }) => {
  if (!show) return null;
  return (
    <div className="bg-warning/10 border border-warning rounded-lg px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="text-warning shrink-0" size={20} aria-hidden="true" />
      <p className="text-foreground text-sm font-semibold flex-1">
        Cash exceeds the drawer limit — lift before closing the shift.
      </p>
      <Button
        onClick={onLift}
        className="shrink-0 px-4 py-1.5 rounded-lg bg-warning text-primary-fg text-sm font-semibold hover:bg-warning/80 transition-colors"
      >
        Lift Cash
      </Button>
    </div>
  );
};

export default DrawerLimitWarning;
