"use client";

import { Line } from "react-chartjs-2";
import type { MultiSeries,Series } from "@cms/lib/analytics";
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

interface ChartsProps {
  traffic: Series;
  conversion: Series;
  sales: Series;
  emailOpens: Series;
  emailClicks: Series;
  campaignSales: Series;
  discountRedemptions: Series;
  discountRedemptionsByCode: MultiSeries;
  aiCrawl: Series;
}

export function Charts({
  traffic,
  conversion,
  sales,
  emailOpens,
  emailClicks,
  campaignSales,
  discountRedemptions,
  discountRedemptionsByCode,
  aiCrawl,
}: ChartsProps) {
  const colors = [
    "rgb(255, 99, 132)",
    "rgb(54, 162, 235)",
    "rgb(255, 205, 86)",
    "rgb(75, 192, 192)",
    "rgb(153, 102, 255)",
    "rgb(201, 203, 207)",
    "rgb(255, 159, 64)",
  ];
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
        <h3 className="mb-2 font-semibold">Email Opens</h3>
        <Line
          data={{
            labels: emailOpens.labels,
            datasets: [
              {
                label: "Email opens",
                data: emailOpens.data,
                borderColor: "rgb(54, 162, 235)",
              },
            ],
          }}
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Email Clicks</h3>
        <Line
          data={{
            labels: emailClicks.labels,
            datasets: [
              {
                label: "Email clicks",
                data: emailClicks.data,
                borderColor: "rgb(255, 205, 86)",
              },
            ],
          }}
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Campaign Sales</h3>
        <Line
          data={{
            labels: campaignSales.labels,
            datasets: [
              {
                label: "Campaign sales",
                data: campaignSales.data,
                borderColor: "rgb(255, 159, 64)",
              },
            ],
          }}
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Discount Redemptions</h3>
        <Line
          data={{
            labels: discountRedemptions.labels,
            datasets: [
              {
                label: "Discount redemptions",
                data: discountRedemptions.data,
                borderColor: "rgb(201, 203, 207)",
              },
            ],
          }}
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Redemptions by Code</h3>
        <Line
          data={{
            labels: discountRedemptionsByCode.labels,
            datasets: discountRedemptionsByCode.datasets.map(
              (d: { label: string; data: number[] }, i: number) => ({
                label: d.label,
                data: d.data,
                borderColor: colors[i % colors.length],
              })
            ),
          }}
        />
      </div>
      <div>
        <h3 className="mb-2 font-semibold">AI Catalog Requests</h3>
        <Line
          data={{
            labels: aiCrawl.labels,
            datasets: [
              {
                label: "AI catalog requests",
                data: aiCrawl.data,
                borderColor: "rgb(99, 132, 255)",
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
