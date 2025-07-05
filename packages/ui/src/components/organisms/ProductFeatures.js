import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckIcon } from "@radix-ui/react-icons";
import { cn } from "../../utils/cn";
export function ProductFeatures({ features, className, ...props }) {
    return (_jsx("ul", { className: cn("space-y-2", className), ...props, children: features.map((f, idx) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckIcon, { className: "mt-1 h-4 w-4 shrink-0" }), _jsx("span", { children: f })] }, idx))) }));
}
