// packages/ui/components/templates/AnalyticsDashboardTemplate.stories.tsx

import { Meta, StoryObj } from "@storybook/nextjs";
import type { ChartData } from "chart.js";
import React from "react";

import type { Column } from "../organisms/DataTable";
import {
  AnalyticsDashboardTemplate,
  type AnalyticsDashboardProps,
} from "./AnalyticsDashboardTemplate";

/* ------------------------------------------------------------------ *
 *  Row model & mock data
 * ------------------------------------------------------------------ */
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
      tension: 0.3,
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

/* ------------------------------------------------------------------ *
 *  Generic-aware wrapper
 * ------------------------------------------------------------------ *
 *  Storybook cannot infer generics, so expose a concrete component
 *  with `<Row>` baked in.
 * ------------------------------------------------------------------ */
const AnalyticsForRows: React.FC<AnalyticsDashboardProps<Row>> = (props) => (
  <AnalyticsDashboardTemplate<Row> {...props} />
);

/* ------------------------------------------------------------------ *
 *  Storybook meta
 * ------------------------------------------------------------------ */
const meta: Meta<typeof AnalyticsForRows> = {
  title: "Templates/Analytics Dashboard",
  component: AnalyticsForRows,
  parameters: {
    docs: {
      description: {
        component: "Analytics dashboard template combining KPI stats, a configurable chart and a generic data table.",
      },
    },
  },
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
type Story = StoryObj<typeof AnalyticsForRows>;
const baseArgs = meta.args!;

export const Default: Story = {};
export const Loading: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "loading" },
};
export const Empty: Story = {
  args: { ...baseArgs, stats: [], tableRows: [] },
  parameters: { dataState: "empty" },
};
export const Error: Story = {
  args: { ...baseArgs },
  parameters: { dataState: "error" },
};
export const RTL: Story = {
  args: { ...baseArgs },
  parameters: { rtl: true },
};
