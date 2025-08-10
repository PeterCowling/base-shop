"use client";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  sales: { date: string; value: number }[];
  traffic: { date: string; value: number }[];
}

export default function DashboardCharts({ sales, traffic }: Props) {
  const salesConfig = {
    labels: sales.map((s) => s.date),
    datasets: [
      {
        label: "Sales",
        data: sales.map((s) => s.value),
        borderColor: "rgb(75, 192, 192)",
        fill: false,
      },
    ],
  };
  const trafficConfig = {
    labels: traffic.map((t) => t.date),
    datasets: [
      {
        label: "Page Views",
        data: traffic.map((t) => t.value),
        borderColor: "rgb(54, 162, 235)",
        fill: false,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <Line data={salesConfig} />
      <Line data={trafficConfig} />
    </div>
  );
}
