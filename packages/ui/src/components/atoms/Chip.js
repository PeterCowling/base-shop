import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Tag } from "./Tag";
export const Chip = React.forwardRef(({ onRemove, children, className, ...props }, ref) => (_jsxs(Tag, { ref: ref, className: cn("inline-flex items-center gap-1", className), ...props, children: [children, onRemove && (_jsx("button", { type: "button", onClick: onRemove, className: "ml-1 font-bold focus:outline-none", children: "x" }))] })));
Chip.displayName = "Chip";
