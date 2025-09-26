import { CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { cn } from "../../utils/style";

export interface CheckoutStepperProps
  extends React.HTMLAttributes<HTMLOListElement> {
  /**
   * Ordered list of step labels.
   */
  steps: string[];
  /**
   * Zero-based index of the active step.
   */
  currentStep: number;
}

/**
 * Horizontal progress indicator for the checkout flow.
 */
export function CheckoutStepper({
  steps,
  currentStep,
  className,
  ...props
}: CheckoutStepperProps) {
  return (
    <ol className={cn("flex items-center gap-4 text-sm", className)} {...props}>
      {steps.map((step, idx) => (
        <li key={step} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              "grid size-6 place-content-center rounded-full border",
              idx < currentStep && "bg-primary border-primary text-primary-fg",
              idx === currentStep && "border-primary",
              idx > currentStep && "text-muted-foreground border-muted"
            )}
          >
            {idx < currentStep ? <CheckIcon className="h-4 w-4" /> : idx + 1}
          </span>
          <span className={cn(idx === currentStep && "font-medium")}>
            {step}
          </span>
          {idx < steps.length - 1 && (
            <span className="border-muted ms-2 flex-1 border-t" />
          )}
        </li>
      ))}
    </ol>
  );
}
