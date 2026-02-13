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
  const isComplete = safeCurrent >= safeTotal;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-xs font-semibold text-primary">
        {isComplete ? "Almost done" : `Step ${safeCurrent} of ${safeTotal}`}
      </div>
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={safeCurrent}
      >
        {Array.from({ length: safeTotal }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < safeCurrent ? "bg-primary" : "bg-muted/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default StepProgress;
