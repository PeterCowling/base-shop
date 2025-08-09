// packages/ui/components/atoms/primitives/checkbox.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { cn } from "../../../utils/cn";
export const Checkbox = React.forwardRef(({ className, ...props }, ref) => (_jsx(CheckboxPrimitive.Root, { ref: ref, className: cn("peer border-input ring-offset-background focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50", className), ...props, children: _jsx(CheckboxPrimitive.Indicator, { className: "flex items-center justify-center text-current", children: _jsx(CheckIcon, { className: "h-3.5 w-3.5" }) }) })));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
