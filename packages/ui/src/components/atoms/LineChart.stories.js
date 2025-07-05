import { LineChart } from "./LineChart";
const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
        {
            label: "Sales",
            data: [12, 19, 3, 5, 2, 3, 7],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.5)",
        },
    ],
};
const baseOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
};
const meta = {
    title: "Atoms/LineChart",
    component: LineChart,
    args: { data, options: baseOptions },
};
export default meta;
export const Primary = {};
export const WithoutTooltip = {
    args: {
        options: {
            ...baseOptions,
            plugins: { ...baseOptions.plugins, tooltip: { enabled: false } },
        },
    },
};
