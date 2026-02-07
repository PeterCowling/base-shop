"use client";

import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface LineChartProps {
  data: ChartData<"line">;
  options?: ChartOptions<"line">;
  className?: string;
}

export function LineChart({ data, options, className }: LineChartProps) {
  return (
    <Line
      data={data}
      {...(options !== undefined ? { options } : {})}
      {...(className !== undefined ? { className } : {})}
      data-cy="line-chart"
      data-testid="line-chart"
    />
  );
}
