"use client";

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
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Series {
  label: string;
  data: number[];
}

interface Props {
  labels: string[];
  series: Series[];
}

const COLORS = [
  "rgb(255, 99, 132)",
  "rgb(54, 162, 235)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(153, 102, 255)",
  "rgb(255, 159, 64)",
  "rgb(201, 203, 207)",
];

export function DiscountCodesChart({ labels, series }: Props) {
  const datasets = series.map((s, idx) => ({
    label: s.label,
    data: s.data,
    borderColor: COLORS[idx % COLORS.length],
  }));
  return (
    <div>
      <h3 className="mb-2 font-semibold">Discount Redemptions by Code</h3>
      <Line data={{ labels, datasets }} />
    </div>
  );
}

