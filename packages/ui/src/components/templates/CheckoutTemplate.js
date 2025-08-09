import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Button } from "../atoms/shadcn";
export function CheckoutTemplate({ steps, initialStep = 0, onStepChange, onComplete, className, ...props }) {
    const [step, setStep] = React.useState(initialStep);
    React.useEffect(() => {
        onStepChange?.(step);
    }, [step, onStepChange]);
    const isLast = step === steps.length - 1;
    return (_jsxs("div", { className: cn("space-y-6", className), ...props, children: [_jsx("ol", { className: "flex items-center gap-4", children: steps.map((s, idx) => (_jsxs("li", { className: "flex flex-1 flex-col items-center", children: [_jsx("div", { className: cn("mb-1 flex h-8 w-8 items-center justify-center rounded-full border", idx === step
                                ? "bg-primary border-primary text-white"
                                : idx < step
                                    ? "bg-primary/80 border-primary/80 text-white"
                                    : "bg-muted text-muted-foreground"), children: idx + 1 }), _jsx("span", { className: cn("text-sm", idx === step && "font-medium"), children: s.label })] }, idx))) }), _jsx("div", { children: steps[step].content }), _jsxs("div", { className: "flex justify-between", children: [_jsx(Button, { onClick: () => setStep(step - 1), disabled: step === 0, variant: "outline", children: "Back" }), _jsx(Button, { onClick: () => {
                            if (isLast) {
                                onComplete?.();
                            }
                            else {
                                setStep(step + 1);
                            }
                        }, children: isLast ? "Finish" : "Next" })] })] }));
}
