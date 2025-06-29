import { type Meta, type StoryObj } from "@storybook/react";
import type { ChartData } from "chart.js";
import type { Column } from "../organisms/DataTable";
import { AnalyticsDashboardTemplate } from "./AnalyticsDashboardTemplate";

interface Row {
  id: number;
  amount: number;
}

const stats = [
  { label: "Orders", value: 42 },
  { label: "Users", value: 10 },
];

const chartData: ChartData<"line"> = {
  labels: ["Jan", "Feb", "Mar"],
  datasets: [
    {
      label: "Sales",
      data: [10, 20, 15],
    },
  ],
};

const rows: Row[] = [
  { id: 1, amount: 100 },
  { id: 2, amount: 200 },
];

const columns: Column<Row>[] = [
  { header: "ID", render: (r) => r.id },
  { header: "Amount", render: (r) => r.amount },
];

const meta: Meta<typeof AnalyticsDashboardTemplate> = {
  component: AnalyticsDashboardTemplate,
  args: {
    stats,
    chartData,
    tableRows: rows,
    tableColumns: columns,
  },
};
export default meta;

export const Default: StoryObj<typeof AnalyticsDashboardTemplate> = {};
