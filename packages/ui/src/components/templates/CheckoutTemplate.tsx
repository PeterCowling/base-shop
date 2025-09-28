"use client"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: Next.js directive string
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
  /* eslint-disable-next-line ds/no-hardcoded-copy -- PB-1234 [ttl=2026-01-31]: design tokens / class names */
  const stepActive = "bg-primary border-primary text-primary-fg"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: style token literal
  /* eslint-disable-next-line ds/no-hardcoded-copy -- PB-1234 [ttl=2026-01-31]: design tokens / class names */
  const stepDone = "bg-primary/80 border-primary/80 text-primary-fg"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: style token literal
  /* eslint-disable-next-line ds/no-hardcoded-copy -- PB-1234 [ttl=2026-01-31]: design tokens / class names */
  const stepTodo = "bg-muted text-muted-foreground"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: style token literal
  /* eslint-disable-next-line ds/no-hardcoded-copy -- PB-1234 [ttl=2026-01-31]: design tokens / class names */
  const circleBase = "mb-1 h-8 w-8 justify-center rounded-full border"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: style token literal
  const primaryToken = "--color-primary"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: DS token literal
  const mutedToken = "--color-muted"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: DS token literal
  const spacingClass = "space-y-6"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: layout class names
  const textSmClass = "text-sm"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: typography utility
  const fontMediumClass = "font-medium"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: typography utility
  const outlineVariant = "outline"; // i18n-exempt -- I18N-0001 [ttl=2026-01-31]: design-system variant name

  React.useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const isLast = step === steps.length - 1;

  return (
    <div className={cn(spacingClass, className)} {...props}>
      <Inline gap={4} alignY="center" role="list">{/* i18n-exempt -- I18N-0001 [ttl=2026-01-31]: ARIA role literal */}
        {steps.map((s, idx) => (
          <Stack key={s.label} align="center" className="flex-1" role="listitem">{/* i18n-exempt -- I18N-0001 [ttl=2026-01-31]: ARIA role literal */}
            <Inline
              className={cn(circleBase, idx === step ? stepActive : idx < step ? stepDone : stepTodo)}
              data-token={idx === step || idx < step ? primaryToken : mutedToken}
            >
              {idx + 1}
            </Inline>
            <span className={cn(textSmClass, idx === step && fontMediumClass)}>
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
          variant={outlineVariant}
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
