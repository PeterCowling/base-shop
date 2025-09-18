import type { ReactNode } from "react";
import { cn } from "../../../../utils/style";
import { StepIndicator } from "../shared";
import type { StepDefinition } from "../shared/StepIndicator";

interface SegmentBuilderWizardLayoutProps {
  steps: StepDefinition[];
  currentStepIndex: number;
  onStepSelect: (index: number) => void;
  className?: string;
  children: ReactNode;
}

export function SegmentBuilderWizardLayout({
  steps,
  currentStepIndex,
  onStepSelect,
  className,
  children,
}: SegmentBuilderWizardLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <StepIndicator
        steps={steps}
        currentStep={currentStepIndex}
        onStepSelect={onStepSelect}
      />
      {children}
    </div>
  );
}
