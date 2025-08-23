import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Card, CardContent } from "./primitives/card";
export const StatCard = React.forwardRef(({ label, value, className, ...props }, ref) => (_jsx(Card, { ref: ref, className: cn(className), ...props, children: _jsxs(CardContent, { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-muted-foreground text-sm", children: label }), _jsx("span", { className: "text-2xl font-semibold", children: value })] }) })));
StatCard.displayName = "StatCard";
