import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { DataTable } from "../organisms/DataTable";
import { StatsGrid } from "../organisms/StatsGrid";
export function LoyaltyHubTemplate({ stats, progress, historyRows, historyColumns, className, ...props }) {
    const percent = progress ? (progress.current / progress.goal) * 100 : 0;
    return (_jsxs("div", { className: cn("space-y-6", className), ...props, children: [_jsx("h2", { className: "text-xl font-semibold", children: "Loyalty Hub" }), _jsx(StatsGrid, { items: stats }), progress && (_jsxs("div", { className: "space-y-1", children: [progress.label && (_jsx("span", { className: "text-sm font-medium", children: progress.label })), _jsx("div", { className: "bg-muted h-2 w-full overflow-hidden rounded", children: _jsx("div", { className: "bg-primary h-full", style: { width: `${percent}%` } }) }), _jsxs("div", { className: "text-muted-foreground text-sm", children: [progress.current, "/", progress.goal, " points"] })] })), _jsx(DataTable, { rows: historyRows, columns: historyColumns })] }));
}
