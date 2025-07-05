import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
export const SideNav = React.forwardRef(({ className, width = "w-48", ...props }, ref) => (_jsx("aside", { ref: ref, className: cn(width, "border-r p-4", className), ...props })));
SideNav.displayName = "SideNav";
