import * as React from "react";
export interface CheckoutStepperProps extends React.HTMLAttributes<HTMLOListElement> {
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
export declare function CheckoutStepper({ steps, currentStep, className, ...props }: CheckoutStepperProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CheckoutStepper.d.ts.map