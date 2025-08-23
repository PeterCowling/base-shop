import type { ChartData, ChartOptions } from "chart.js";
import { type Column } from "../organisms/DataTable";
import { type StatItem } from "../organisms/StatsGrid";
export interface AnalyticsDashboardProps<T> {
    stats: StatItem[];
    chartData: ChartData<"line">;
    chartOptions?: ChartOptions<"line">;
    tableRows: T[];
    tableColumns: Column<T>[];
}
export declare function AnalyticsDashboardTemplate<T>({ stats, chartData, chartOptions, tableRows, tableColumns, }: AnalyticsDashboardProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnalyticsDashboardTemplate.d.ts.map