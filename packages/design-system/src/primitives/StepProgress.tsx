"use client";

import { cn } from "../utils/style/cn";

export interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
  className?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function StepProgress({
  currentStep,
  totalSteps,
  label = "Step progress",
  className,
}: StepProgressProps) {
  const safeTotal = Math.max(totalSteps, 1);
  const safeCurrent = clamp(currentStep, 0, safeTotal);
  const percent = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-xs font-semibold text-primary">
        Step {safeCurrent} of {safeTotal}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default StepProgress;
