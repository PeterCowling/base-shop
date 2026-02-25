"use client";

import { clamp } from "@acme/lib";

import { cn } from "../utils/style/cn";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";

export interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
  className?: string;
  /** Semantic segment shape. Ignored when `segmentRadius` is provided. */
  segmentShape?: PrimitiveShape;
  /** Explicit segment radius token override. */
  segmentRadius?: PrimitiveRadius;
}

export function StepProgress({
  currentStep,
  totalSteps,
  label = "Step progress",
  className,
  segmentShape,
  segmentRadius,
}: StepProgressProps) {
  const safeTotal = Math.max(totalSteps, 1);
  const safeCurrent = clamp(currentStep, 0, safeTotal);
  const isComplete = safeCurrent >= safeTotal;
  const segmentShapeRadiusClass = resolveShapeRadiusClass({
    shape: segmentShape,
    radius: segmentRadius,
    defaultRadius: "full",
  });

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-xs font-semibold text-primary">
        {isComplete ? "Almost done" : `Step ${safeCurrent} of ${safeTotal}`}
      </div>
      <div
        // eslint-disable-next-line ds/enforce-layout-primitives -- Step progress bar uses flex layout for horizontal progress indicators, acceptable in primitive component [DS-01]
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
              "h-1.5 flex-1 transition-colors",
              segmentShapeRadiusClass,
              i < safeCurrent ? "bg-primary" : "bg-muted/40",
            )}
            data-ds-contrast-exempt
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

export default StepProgress;
