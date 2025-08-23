import { jsx as _jsx } from "react/jsx-runtime";
// packages/ui/components/atoms/shadcn/Button.tsx
import * as React from "react";
import { cn } from "../../../utils/style";
import { Button as BaseButton } from "../primitives/button";
import { Slot } from "../primitives/slot";
export const Button = React.forwardRef(({ variant = "default", className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    if (variant === "destructive") {
        const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-4 py-2";
        const styles = "bg-destructive text-destructive-foreground hover:bg-destructive/90";
        return (_jsx(Comp, { ref: ref, className: cn(base, styles, className), ...props }));
    }
    return (_jsx(BaseButton, { ref: ref, variant: variant, asChild: asChild, className: className, ...props }));
});
Button.displayName = "Button";
