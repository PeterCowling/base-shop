import type { ChartData, ChartOptions } from "chart.js";

import { LineChart } from "../atoms/LineChart";
import { type Column,DataTable } from "../organisms/DataTable";
import { type StatItem,StatsGrid } from "../organisms/StatsGrid";

export interface AnalyticsDashboardProps<T> {
  stats: StatItem[];
  chartData: ChartData<"line">;
  chartOptions?: ChartOptions<"line">;
  tableRows: T[];
  tableColumns: Column<T>[];
}

export function AnalyticsDashboardTemplate<T>({
  stats,
  chartData,
  chartOptions,
  tableRows,
  tableColumns,
}: AnalyticsDashboardProps<T>) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics</h2>
      <StatsGrid items={stats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <LineChart
          data={chartData}
          options={chartOptions}
          className="bg-bg"
        />
        <DataTable rows={tableRows} columns={tableColumns} />
      </div>
    </div>
  );
}
