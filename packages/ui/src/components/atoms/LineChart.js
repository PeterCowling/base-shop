import { jsx as _jsx } from "react/jsx-runtime";
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, } from "chart.js";
import { Line } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
export function LineChart({ data, options, className }) {
    return (_jsx(Line, { data: data, options: options, className: className, "data-testid": "line-chart" }));
}
