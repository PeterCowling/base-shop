import type { ReactNode } from "react";
import { Progress, Tag } from "../../../atoms";
import { cn } from "../../../../utils/style";

export interface StepDefinition {
  id: string;
  label: string;
  description?: ReactNode;
}

export interface StepIndicatorProps {
  steps: readonly StepDefinition[];
  currentStep: number;
  className?: string;
  onStepSelect?: (index: number, step: StepDefinition) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  className,
  onStepSelect,
}: StepIndicatorProps) {
  const progressValue =
    steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const active = steps[currentStep];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </span>
        <span>{Math.round(progressValue)}% complete</span>
      </div>
      <Progress value={progressValue} aria-label="Progress" />
      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const tag = (
            <Tag
              key={step.id}
              variant={isActive ? "warning" : isCompleted ? "success" : "default"}
              className={cn(
                "cursor-default text-xs uppercase tracking-wide",
                onStepSelect && "cursor-pointer"
              )}
            >
              <span className="flex items-center gap-1">
                <span className="font-medium">{index + 1}.</span>
                {step.label}
              </span>
            </Tag>
          );
          if (!onStepSelect) return tag;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepSelect(index, step)}
              className="appearance-none border-0 bg-transparent p-0"
            >
              {tag}
            </button>
          );
        })}
      </div>
      {active?.description && (
        <p className="text-muted-foreground text-sm">{active.description}</p>
      )}
    </div>
  );
}
