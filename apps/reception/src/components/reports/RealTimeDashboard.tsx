"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

import useAllFinancialTransactionsData from "../../hooks/data/useAllFinancialTransactionsData";
import { useCashCountsData } from "../../hooks/data/useCashCountsData";
import { extractItalyDate,formatItalyDateFromIso } from "../../utils/dateUtils";
import { isVoidedTransaction } from "../../utils/transactionUtils";

Chart.register(...registerables);

const REFRESH_INTERVAL_MS = 60000; // 60 seconds

export default function RealTimeDashboard(): JSX.Element {
  const { allFinancialTransactions, loading, error } =
    useAllFinancialTransactionsData();
  const {
    cashCounts,
    loading: cashLoading,
    error: cashError,
  } = useCashCountsData();

  // use a state setter alone to force a re-render on an interval
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => forceRefresh((t) => t + 1),
      REFRESH_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, []);

  const transactions = useMemo(() => {
    if (!allFinancialTransactions) return [];
    return Object.values(allFinancialTransactions).filter(
      (txn) => !isVoidedTransaction(txn)
    );
  }, [allFinancialTransactions]);

  const salesTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach((txn) => {
      if (!txn.timestamp) return;
      const dateKey = extractItalyDate(txn.timestamp);
      totals[dateKey] = (totals[dateKey] || 0) + (txn.amount || 0);
    });
    return totals;
  }, [transactions]);

  const tenderTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach((txn) => {
      const method = txn.method || "Other";
      totals[method] = (totals[method] || 0) + (txn.amount || 0);
    });
    return totals;
  }, [transactions]);

  const varianceArr = useMemo(() => {
    return cashCounts.filter((c) => c.type === "close").slice(-10);
  }, [cashCounts]);

  const salesChartData = useMemo(() => {
    const entries = Object.entries(salesTotals).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    return {
      labels: entries.map(([d]) => d),
      datasets: [
        {
          label: "Sales (€)",
          data: entries.map(([, v]) => v),
          backgroundColor: "hsl(var(--chart-1))",
        },
      ],
    };
  }, [salesTotals]);

  const tenderChartData = useMemo(() => {
    const entries = Object.entries(tenderTotals);
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ];
    return {
      labels: entries.map(([m]) => m),
      datasets: [
        {
          data: entries.map(([, v]) => v),
          backgroundColor: colors.slice(0, entries.length),
        },
      ],
    };
  }, [tenderTotals]);

    const varianceChartData = useMemo(() => {
      return {
        labels: varianceArr.map((v) =>
          formatItalyDateFromIso(v.timestamp)
        ),
        datasets: [
          {
            label: "Variance (€)",
          data: varianceArr.map((v) => v.difference),
          borderColor: "hsl(var(--chart-4))",
          backgroundColor: "hsl(var(--chart-4) / 0.3)",
          fill: true,
        },
      ],
    };
  }, [varianceArr]);

  if (loading || cashLoading) {
    return <p className="p-4">Loading data...</p>;
  }

  if (error || cashError) {
    return (
      <p className="p-4 text-error-main">
        Error: {error ? String(error) : String(cashError)}
      </p>
    );
  }

  return (
    <div className="min-h-screen p-5 space-y-8 bg-surface-2">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        REAL TIME DASHBOARD
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Sales Totals</h2>
          <Bar data={salesChartData} options={{ responsive: true }} />
        </div>
        <div className="bg-surface rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-2">Tender Mix</h2>
          <Pie data={tenderChartData} />
        </div>
      </div>
      <div className="bg-surface rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-2">Current Variances</h2>
        <Line data={varianceChartData} options={{ responsive: true }} />
      </div>
    </div>
  );
}
