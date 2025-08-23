import * as React from "react";
export interface CheckoutStep {
    label: string;
    content: React.ReactNode;
}
export interface CheckoutTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    steps: CheckoutStep[];
    initialStep?: number;
    onStepChange?: (step: number) => void;
    onComplete?: () => void;
}
export declare function CheckoutTemplate({ steps, initialStep, onStepChange, onComplete, className, ...props }: CheckoutTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CheckoutTemplate.d.ts.map