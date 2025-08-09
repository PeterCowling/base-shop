import { jsx as _jsx } from "react/jsx-runtime";
// packages/ui/components/atoms/primitives/button.tsx
import * as React from "react";
import { cn } from "../../../utils/cn";
import { Slot } from "./slot";
/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
export const Button = React.forwardRef(({ className, variant = "default", asChild = false, ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    // Exclude `undefined` from the key type with NonNullable<>
    const variants = {
        default: "bg-primary text-white hover:bg-primary/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
    };
    const Comp = asChild ? Slot : "button";
    return (_jsx(Comp, { ref: ref, className: cn(base, variants[variant], className), ...props }));
});
Button.displayName = "Button";
