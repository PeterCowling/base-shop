import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Loader = React.forwardRef(({ className, size = 20, ...props }, ref) => {
    const dimension = `h-[${size}px] w-[${size}px]`;
    return (_jsx("div", { ref: ref, className: cn("animate-spin rounded-full border-2 border-current border-t-transparent", dimension, className), ...props }));
});
Loader.displayName = "Loader";
