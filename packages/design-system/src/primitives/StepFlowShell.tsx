"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { cn } from "../utils/style/cn";

import MilestoneToast from "./MilestoneToast";
import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "./shape-radius";
import StepProgress from "./StepProgress";
import TrustCue from "./TrustCue";

interface TrustCueCopy {
  title: string;
  description: string;
}

export interface StepFlowShellProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  description: ReactNode;
  trustCue?: TrustCueCopy;
  milestoneMessage?: string | null;
  onBack?: () => void;
  children: ReactNode;
  className?: string;
  /** Semantic back-button shape. Ignored when `backButtonRadius` is provided. */
  backButtonShape?: PrimitiveShape;
  /** Explicit back-button radius token override. */
  backButtonRadius?: PrimitiveRadius;
  /** Semantic progress segment shape. Ignored when `progressSegmentRadius` is provided. */
  progressSegmentShape?: PrimitiveShape;
  /** Explicit progress segment radius token override. */
  progressSegmentRadius?: PrimitiveRadius;
  /** Semantic trust-cue shape. Ignored when `trustCueRadius` is provided. */
  trustCueShape?: PrimitiveShape;
  /** Explicit trust-cue radius token override. */
  trustCueRadius?: PrimitiveRadius;
  /** Semantic milestone toast shape. Ignored when `milestoneRadius` is provided. */
  milestoneShape?: PrimitiveShape;
  /** Explicit milestone toast radius token override. */
  milestoneRadius?: PrimitiveRadius;
}

export function StepFlowShell({
  currentStep,
  totalSteps,
  title,
  description,
  trustCue,
  milestoneMessage = null,
  onBack,
  children,
  className,
  backButtonShape,
  backButtonRadius,
  progressSegmentShape,
  progressSegmentRadius,
  trustCueShape,
  trustCueRadius,
  milestoneShape,
  milestoneRadius,
}: StepFlowShellProps) {
  const backButtonShapeRadiusClass = resolveShapeRadiusClass({
    shape: backButtonShape,
    radius: backButtonRadius,
    defaultRadius: "full",
  });

  return (
    <section className={cn("space-y-5", className)} aria-label="Guided onboarding flow">
      <header className="space-y-3">
        {onBack ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
               
              className={cn(
                "flex h-10 w-10 items-center justify-center bg-surface-2 text-fg-muted transition-colors hover:text-fg active:bg-surface-2/70",
                backButtonShapeRadiusClass,
              )}
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <StepProgress
                currentStep={currentStep}
                totalSteps={totalSteps}
                segmentShape={progressSegmentShape}
                segmentRadius={progressSegmentRadius}
              />
            </div>
          </div>
        ) : (
          <StepProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            segmentShape={progressSegmentShape}
            segmentRadius={progressSegmentRadius}
          />
        )}
        <h1 className="min-w-0 break-words text-xl font-bold text-fg">{title}</h1>
        <div className="min-w-0 break-words text-sm text-fg">{description}</div>
        {trustCue ? (
          <TrustCue
            title={trustCue.title}
            description={trustCue.description}
            shape={trustCueShape}
            radius={trustCueRadius}
          />
        ) : null}
      </header>

      <MilestoneToast
        message={milestoneMessage}
        shape={milestoneShape}
        radius={milestoneRadius}
      />
      {children}
    </section>
  );
}

export default StepFlowShell;
