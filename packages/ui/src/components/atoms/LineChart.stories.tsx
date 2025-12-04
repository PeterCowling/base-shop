import { type Meta, type StoryObj } from "@storybook/nextjs";
import type { ChartOptions } from "chart.js";
import { LineChart } from "./LineChart";

const data = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Sales",
      data: [12, 19, 3, 5, 2, 3, 7],
      borderColor: "hsl(var(--color-primary))",
      backgroundColor: "hsl(var(--color-primary) / 0.5)",
    },
  ],
};

const baseOptions: ChartOptions<"line"> = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
};

const meta: Meta<typeof LineChart> = {
  title: "Atoms/LineChart",
  component: LineChart,
  args: { data, options: baseOptions },
};
export default meta;

export const Primary: StoryObj<typeof LineChart> = {};
export const WithoutTooltip: StoryObj<typeof LineChart> = {
  args: {
    options: {
      ...baseOptions,
      plugins: { ...baseOptions.plugins, tooltip: { enabled: false } },
    },
  },
};

export const Default: StoryObj<typeof LineChart> = {};
