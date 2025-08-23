import { jsx as _jsx } from "react/jsx-runtime";
import { Button as UIButton } from "../../atoms/shadcn";
const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
};
export default function Button({ label = "Button", href = "#", variant = "default", size = "md", }) {
    return (_jsx(UIButton, { asChild: true, variant: variant, className: sizeClasses[size], children: _jsx("a", { href: href, children: label }) }));
}
