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
  labels: string[];
  data: number[];
}

interface EmailSeries {
  labels: string[];
  opens: number[];
  clicks: number[];
}

interface ChartsProps {
  traffic: Series;
  conversion: Series;
  sales: Series;
  email: EmailSeries;
}

export function Charts({ traffic, conversion, sales, email }: ChartsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-2 font-semibold">Traffic</h3>
        <Line
          data={{
            labels: traffic.labels,
            datasets: [
              {
                label: "Page views",
                data: traffic.data,
                borderColor: "rgb(75, 192, 192)",
              },
            ],
          }}
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Conversion %</h3>
        <Line
          data={{
            labels: conversion.labels,
            datasets: [
              {
                label: "Conversion",
                data: conversion.data,
                borderColor: "rgb(153, 102, 255)",
              },
            ],
          }}
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Sales</h3>
        <Line
          data={{
            labels: sales.labels,
            datasets: [
              {
                label: "Sales",
                data: sales.data,
                borderColor: "rgb(255, 99, 132)",
              },
            ],
          }}
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Email</h3>
        <Line
          data={{
            labels: email.labels,
            datasets: [
              {
                label: "Opens",
                data: email.opens,
                borderColor: "rgb(54, 162, 235)",
              },
              {
                label: "Clicks",
                data: email.clicks,
                borderColor: "rgb(255, 205, 86)",
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
