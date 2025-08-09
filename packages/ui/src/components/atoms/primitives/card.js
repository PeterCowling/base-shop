import { jsx as _jsx } from "react/jsx-runtime";
// packages/ui/components/atoms/primitives/card.tsx
import * as React from "react";
import { cn } from "../../../utils/cn";
export const Card = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("bg-card text-card-foreground rounded-xl border shadow", className), ...props })));
Card.displayName = "Card";
export const CardContent = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("p-6", className), ...props })));
CardContent.displayName = "CardContent";
