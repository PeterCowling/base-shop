import { jsx as _jsx } from "react/jsx-runtime";
import { AnalyticsDashboardTemplate, } from "./AnalyticsDashboardTemplate";
const stats = [
    { label: "Orders", value: 42 },
    { label: "Users", value: 10 },
];
const chartData = {
    labels: ["Jan", "Feb", "Mar"],
    datasets: [
        {
            label: "Sales",
            data: [10, 20, 15],
            tension: 0.3,
        },
    ],
};
const rows = [
    { id: 1, amount: 100 },
    { id: 2, amount: 200 },
];
const columns = [
    { header: "ID", render: (r) => r.id },
    { header: "Amount", render: (r) => r.amount },
];
/* ------------------------------------------------------------------ *
 *  Generic-aware wrapper
 * ------------------------------------------------------------------ *
 *  Storybook cannot infer generics, so expose a concrete component
 *  with `<Row>` baked in.
 * ------------------------------------------------------------------ */
const AnalyticsForRows = (props) => (_jsx(AnalyticsDashboardTemplate, { ...props }));
/* ------------------------------------------------------------------ *
 *  Storybook meta
 * ------------------------------------------------------------------ */
const meta = {
    title: "Templates/Analytics Dashboard",
    component: AnalyticsForRows,
    args: {
        stats,
        chartData,
        tableRows: rows,
        tableColumns: columns,
    },
};
export default meta;
/* ------------------------------------------------------------------ *
 *  Stories
 * ------------------------------------------------------------------ */
export const Default = {};
