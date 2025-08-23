import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
export const PaginationDot = React.forwardRef(({ active = false, size = "2", className, ...props }, ref) => (_jsx("button", { ref: ref, className: cn(`h-${size} w-${size} rounded-full`, active ? "bg-primary" : "bg-muted", className), ...props })));
PaginationDot.displayName = "PaginationDot";
