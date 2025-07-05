import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LineChart } from "../atoms/LineChart";
import { DataTable } from "../organisms/DataTable";
import { StatsGrid } from "../organisms/StatsGrid";
export function AnalyticsDashboardTemplate({ stats, chartData, chartOptions, tableRows, tableColumns, }) {
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Analytics" }), _jsx(StatsGrid, { items: stats }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsx(LineChart, { data: chartData, options: chartOptions, className: "bg-white" }), _jsx(DataTable, { rows: tableRows, columns: tableColumns })] })] }));
}
