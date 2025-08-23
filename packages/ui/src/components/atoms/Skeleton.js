import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const Skeleton = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("bg-muted animate-pulse rounded-md", className), ...props })));
Skeleton.displayName = "Skeleton";
