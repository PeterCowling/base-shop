import { jsx as _jsx } from "react/jsx-runtime";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";
import { cn } from "../../utils/style";
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverContent = React.forwardRef(({ className, sideOffset = 4, align = "center", ...props }, ref) => (_jsx(PopoverPrimitive.Content, { ref: ref, sideOffset: sideOffset, align: align, className: cn("bg-popover text-popover-foreground z-50 rounded-md border p-4 shadow-md outline-none", className), ...props })));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
