import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
export const Content = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("flex-1 p-4", className), ...props })));
Content.displayName = "Content";
