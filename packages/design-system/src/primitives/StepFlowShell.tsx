"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { cn } from "../utils/style/cn";

import MilestoneToast from "./MilestoneToast";
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
}: StepFlowShellProps) {
  return (
    <section className={cn("space-y-5", className)} aria-label="Guided onboarding flow">
      <header className="space-y-3">
        {onBack ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              // eslint-disable-next-line ds/min-tap-size -- Back button is a decorative navigation control with proper 40x40px touch target, not a primary action button [DS-01]
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-colors hover:text-fg active:bg-surface-2/70"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
            </div>
          </div>
        ) : (
          <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
        )}
        <h1 className="text-xl font-bold text-fg">{title}</h1>
        <div className="text-sm text-fg">{description}</div>
        {trustCue ? (
          <TrustCue
            title={trustCue.title}
            description={trustCue.description}
          />
        ) : null}
      </header>

      <MilestoneToast message={milestoneMessage} />
      {children}
    </section>
  );
}

export default StepFlowShell;
