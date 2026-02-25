import { type FC, useMemo } from "react";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import { canAccess, Permissions } from "../../lib/roles";
import type { User } from "../../types/domains/userDomain";

interface StepProgressProps {
  step: number;
  onStepChange: (n: number) => void;
  user?: User | null;
}

const labels = ["Cash", "Receipts", "Keycards"];

const StepProgress: FC<StepProgressProps> = ({ step, onStepChange, user }) => {
  const canOverride = useMemo(
    () => canAccess(user ?? null, Permissions.MANAGEMENT_ACCESS),
    [user]
  );

  const handleClick = (index: number) => {
    if (index < step || (canOverride && index > step)) {
      onStepChange(index);
    }
  };

  return (
    <Inline asChild wrap={false} gap={0} className="justify-between mb-4">
      <ol aria-label="Closing progress">
        {labels.map((label, index) => {
          const active = index === step;
          const clickable = index < step || (canOverride && index > step);
          return (
            <li key={label} className="flex flex-1 flex-col items-center">
              <Button
                type="button"
                onClick={() => handleClick(index)}
                disabled={!clickable}
                aria-current={active ? 'step' : undefined}
                className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                  active
                    ? 'bg-primary-main text-primary-fg'
                    : 'bg-surface-3 text-muted-foreground'
                } ${clickable ? 'hover:bg-primary-light' : 'cursor-default'}`}
              >
                {index + 1}
              </Button>
              <span className="text-xs mt-1">{label}</span>
            </li>
          );
        })}
      </ol>
    </Inline>
  );
};

export default StepProgress;
