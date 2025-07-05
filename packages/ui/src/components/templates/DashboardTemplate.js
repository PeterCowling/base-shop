import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// packages/ui/components/templates/DashboardTemplate.tsx
import { StatsGrid } from "../organisms/StatsGrid";
export function DashboardTemplate({ stats }) {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Dashboard" }), _jsx(StatsGrid, { items: stats })] }));
}
