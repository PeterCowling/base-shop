import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DataTable } from "../organisms/DataTable";
import { StatsGrid } from "../organisms/StatsGrid";
export function TrackingDashboardTemplate({ records, stats = [], }) {
    const columns = [
        { header: "ID", render: (r) => r.id },
        { header: "Type", render: (r) => r.type },
        { header: "Provider", render: (r) => r.provider },
        { header: "Status", render: (r) => r.status ?? "" },
        { header: "Updated", render: (r) => r.updated ?? "" },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Tracking" }), stats.length > 0 && _jsx(StatsGrid, { items: stats }), _jsx(DataTable, { rows: records, columns: columns })] }));
}
