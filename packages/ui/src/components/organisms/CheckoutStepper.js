import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "../../utils/cn";
/**
 * Horizontal progress indicator for the checkout flow.
 */
export function CheckoutStepper({ steps, currentStep, className, ...props }) {
    return (_jsx("ol", { className: cn("flex items-center gap-4 text-sm", className), ...props, children: steps.map((step, idx) => (_jsxs("li", { className: "flex flex-1 items-center gap-2", children: [_jsx("span", { className: cn("grid size-6 place-content-center rounded-full border", idx < currentStep && "bg-primary border-primary text-white", idx === currentStep && "border-primary", idx > currentStep && "text-muted-foreground border-muted"), children: idx < currentStep ? _jsx(CheckIcon, { className: "h-4 w-4" }) : idx + 1 }), _jsx("span", { className: cn(idx === currentStep && "font-medium"), children: step }), idx < steps.length - 1 && (_jsx("span", { className: "border-muted ml-2 flex-1 border-t" }))] }, step))) }));
}
