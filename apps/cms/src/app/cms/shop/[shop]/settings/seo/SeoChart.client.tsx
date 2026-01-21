"use client";

import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Props {
  labels: string[];
  scores: number[];
}

export function SeoChart({ labels, scores }: Props) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "SEO Score",
            data: scores,
            borderColor: "rgb(75, 192, 192)",
          },
        ],
      }}
    />
  );
}
