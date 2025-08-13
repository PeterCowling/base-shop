import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";

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
  const [step, setStep] = React.useState(initialStep);

  React.useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const isLast = step === steps.length - 1;

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <ol className="flex items-center gap-4">
        {steps.map((s, idx) => (
          <li key={idx} className="flex flex-1 flex-col items-center">
            <div
              className={cn(
                "mb-1 flex h-8 w-8 items-center justify-center rounded-full border",
                idx === step
                  ? "bg-primary border-primary text-primary-fg"
                  : idx < step
                    ? "bg-primary/80 border-primary/80 text-primary-fg"
                    : "bg-muted text-muted-foreground"
              )}
              data-token={
                idx === step || idx < step
                  ? "--color-primary"
                  : "--color-muted"
              }
            >
              {idx + 1}
            </div>
            <span className={cn("text-sm", idx === step && "font-medium")}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
      <div>{steps[step].content}</div>
      <div className="flex justify-between">
        <Button
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          variant="outline"
        >
          Back
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
          {isLast ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
