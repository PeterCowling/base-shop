"use client";

import type { ReactNode } from "react";

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
  children,
  className,
}: StepFlowShellProps) {
  return (
    <section className={cn("space-y-5", className)} aria-label="Guided onboarding flow">
      <header className="space-y-3">
        <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
        <h1 className="text-2xl font-bold text-fg">{title}</h1>
        <div className="text-sm text-fg-muted">{description}</div>
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
