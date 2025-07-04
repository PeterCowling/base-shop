/// <reference types="react" />
import type { ChartData, ChartOptions } from "chart.js";
export interface LineChartProps {
    data: ChartData<"line">;
    options?: ChartOptions<"line">;
    className?: string;
}
export declare function LineChart({ data, options, className }: LineChartProps): import("react").JSX.Element;
