"use client";
import * as React from "react";
import { cn } from "../../utils/style";
import { useTranslations } from "@acme/i18n";
import { Button } from "../atoms/shadcn";
import { Inline, Stack, Cluster } from "../atoms/primitives";

export interface CheckoutStep {
  label: string;
  content: React.ReactNode;
}

export interface CheckoutTemplateProps
  extends React.HTMLAttributes<HTMLDivElement> {
  steps: CheckoutStep[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
}

export function CheckoutTemplate({
  steps,
  initialStep = 0,
  onStepChange,
  onComplete,
  className,
  ...props
}: CheckoutTemplateProps) {
  const t = useTranslations();
  const [step, setStep] = React.useState(initialStep);
  const stepActive = "bg-primary border-primary text-primary-fg"; // i18n-exempt: style tokens
  const stepDone = "bg-primary/80 border-primary/80 text-primary-fg"; // i18n-exempt: style tokens
  const stepTodo = "bg-muted text-muted-foreground"; // i18n-exempt: style tokens
  const circleBase = "mb-1 h-8 w-8 justify-center rounded-full border"; // i18n-exempt: style tokens
  const primaryToken = "--color-primary"; // i18n-exempt: DS token literal
  const mutedToken = "--color-muted"; // i18n-exempt: DS token literal

  React.useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const isLast = step === steps.length - 1;

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <Inline gap={4} alignY="center" role="list">
        {steps.map((s, idx) => (
          <Stack key={idx} align="center" className="flex-1" role="listitem">
            <Inline
              className={cn(circleBase, idx === step ? stepActive : idx < step ? stepDone : stepTodo)}
              data-token={idx === step || idx < step ? primaryToken : mutedToken}
            >
              {idx + 1}
            </Inline>
            <span className={cn("text-sm", idx === step && "font-medium")}>
              {s.label}
            </span>
          </Stack>
        ))}
      </Inline>
      <div>{steps[step].content}</div>
      <Cluster justify="between">
        <Button
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          variant="outline"
        >
          {t("actions.back")}
        </Button>
        <Button
          onClick={() => {
            if (isLast) {
              onComplete?.();
            } else {
              setStep(step + 1);
            }
          }}
        >
          {isLast ? t("actions.finish") : t("actions.next")}
        </Button>
      </Cluster>
    </div>
  );
}
