'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

export function ChartSection({
  title,
  labels,
  data,
  label,
}: {
  title: string;
  labels: string[];
  data: number[];
  label: string;
}) {
  return (
    <section className="mb-6">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="h-64">
        <Line
          data={{
            labels,
            datasets: [
              {
                label,
                data,
                borderColor: 'rgb(75, 192, 192)',
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>
    </section>
  );
}
