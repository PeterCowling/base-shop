import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { StatCard } from "../atoms/StatCard";
export function StatsGrid({ items, className, ...props }) {
    return (_jsx("div", { className: cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className), ...props, children: items.map((item) => (_jsx(StatCard, { label: item.label, value: item.value }, item.label))) }));
}
