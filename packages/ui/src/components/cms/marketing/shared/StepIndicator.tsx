import type { ReactNode } from "react";
import { Progress, Tag } from "../../../atoms";
import { cn } from "../../../../utils/style";
import { useTranslations } from "@acme/i18n";
import { Inline } from "../../../atoms/primitives/Inline";

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
  const t = useTranslations();
  const progressValue =
    steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const active = steps[currentStep];

  return (
    <div className={cn("space-y-3", className)}>
      <Inline className="justify-between text-sm text-muted-foreground">
        <span>
          {t("pb.tour.stepXofY", {
            current: Math.min(currentStep + 1, steps.length),
            total: steps.length,
          })}
        </span>
        <span>{t("common.percentComplete", { percent: Math.round(progressValue) })}</span>
      </Inline>
      <Progress value={progressValue} aria-label={String(t("common.progress"))} />
      <Inline className="gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const tag = (
            <Tag
              key={step.id}
              variant={isActive ? "warning" : isCompleted ? "success" : "default"}
              className={cn(
                /* i18n-exempt -- DS-000 utility classes, not user copy [ttl=2026-01-01] */
                "cursor-default text-xs uppercase tracking-wide",
                onStepSelect && "cursor-pointer"
              )}
            >
              <Inline className="items-center gap-1">
                <span className="font-medium">{index + 1}.</span>
                {step.label}
              </Inline>
            </Tag>
          );
          if (!onStepSelect) return tag;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepSelect(index, step)}
              className="appearance-none border-0 bg-transparent p-0 min-h-10 min-w-10"
            >
              {tag}
            </button>
          );
        })}
      </Inline>
      {active?.description && (
        <p className="text-muted-foreground text-sm">{active.description}</p>
      )}
    </div>
  );
}
