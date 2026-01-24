// File: src/components/analytics/MenuPerformanceDashboard.tsx

import React, { useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import dayjs from "dayjs";

// Rename the default import to avoid ESLint `import/no-named-as-default` rule
import useProductsHook from "../../hooks/data/bar/useProducts";
import useAllFinancialTransactionsData from "../../hooks/data/useAllFinancialTransactionsData";
import type { FinancialTransaction } from "../../types/hooks/data/allFinancialTransaction";
import { isVoidedTransaction } from "../../utils/transactionUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Simple mapping of menu categories to approximate margin ratios.
 * These ratios are purely illustrative and should be adjusted to
 * reflect real cost of goods if available.
 */
const MARGIN_RATIOS: Partial<Record<string, number>> = {
  Coffee: 0.7,
  Tea: 0.7,
  Juices: 0.6,
  Smoothies: 0.6,
  Soda: 0.6,
  Beer: 0.6,
  Wine: 0.5,
  "Mixed Drinks": 0.5,
  Cocktails: 0.5,
  Spritz: 0.6,
  Sweet: 0.65,
  Savory: 0.65,
  Gelato: 0.7,
  Other: 0.5,
};

function MenuPerformanceDashboard(): React.ReactElement {
  const { allFinancialTransactions, loading, error } =
    useAllFinancialTransactionsData();
  const { getCategoryTypeByProductName, getProductCategory2 } =
    useProductsHook();

  const transactions: FinancialTransaction[] = useMemo(() => {
    if (!allFinancialTransactions) return [];
    return Object.values(allFinancialTransactions).filter(
      (txn) => !isVoidedTransaction(txn)
    );
  }, [allFinancialTransactions]);

  /** Total revenue and profit aggregated by category */
  const {
    categoryMarginPct,
    totalMarginPct,
    hourlyContribution,
    baseCount,
    attachCount,
  } = useMemo(() => {
    const categoryTotals: Record<string, { revenue: number; profit: number }> =
      {};
    const hourlyProfit = Array.from({ length: 24 }, () => 0);
    let totalRevenue = 0;
    let totalProfit = 0;
    let base = 0;
    let attach = 0;

    transactions.forEach((txn: FinancialTransaction) => {
      const { amount, count, description, timestamp } = txn;
      const category = getCategoryTypeByProductName(description) || "Other";
      const subCat = getProductCategory2(description);

      const marginRatio = MARGIN_RATIOS[category] ?? 0.6;
      const revenue = Number(amount) || 0;
      const profit = revenue * marginRatio;

      categoryTotals[category] = categoryTotals[category] || {
        revenue: 0,
        profit: 0,
      };
      categoryTotals[category].revenue += revenue;
      categoryTotals[category].profit += profit;

      totalRevenue += revenue;
      totalProfit += profit;

      const hour = dayjs(timestamp).hour();
      hourlyProfit[hour] += profit;

      if (subCat === "milkAddOn") {
        attach += Number(count) || 0;
      }
      if (
        subCat === "coffee" ||
        subCat === "tea" ||
        subCat === "caffeinatedSoftDrink" ||
        subCat === "energyDrink"
      ) {
        base += Number(count) || 0;
      }
    });

    const catMargin: Record<string, number> = {};
    Object.entries(categoryTotals).forEach(([cat, vals]) => {
      const pct = vals.revenue ? (vals.profit / vals.revenue) * 100 : 0;
      catMargin[cat] = Number(pct.toFixed(1));
    });

    const totalPct = totalRevenue
      ? Number(((totalProfit / totalRevenue) * 100).toFixed(1))
      : 0;

    return {
      categoryMarginPct: catMargin,
      totalMarginPct: totalPct,
      hourlyContribution: hourlyProfit.map((v) => Number(v.toFixed(2))),
      baseCount: base,
      attachCount: attach,
    };
  }, [transactions, getCategoryTypeByProductName, getProductCategory2]);

  if (loading) {
    return <p>Loading transaction data…</p>;
  }

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    return <p className="text-red-600">Error: {message}</p>;
  }

  const marginChartData = {
    labels: Object.keys(categoryMarginPct),
    datasets: [
      {
        label: "Margin %",
        data: Object.values(categoryMarginPct),
        backgroundColor: "#4f46e5",
      },
    ],
  };

  const attachRate = baseCount > 0 ? (attachCount / baseCount) * 100 : 0;
  const attachChartData = {
    labels: ["Base", "Add‑on"],
    datasets: [
      {
        label: "Item Count",
        data: [baseCount, attachCount],
        backgroundColor: ["#0ea5e9", "#fb923c"],
      },
    ],
  };

  const contributionChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}`),
    datasets: [
      {
        label: "Contribution €",
        data: hourlyContribution,
        borderColor: "#10b981",
        backgroundColor: "#a7f3d0",
      },
    ],
  };

  return (
    <div className="space-y-8 p-4 bg-white rounded shadow dark:bg-darkSurface dark:text-darkAccentGreen">
      <h1 className="text-2xl font-semibold mb-4 dark:text-darkAccentGreen">Menu Performance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Bar data={marginChartData} />
        </div>
        <div>
          <Doughnut data={attachChartData} />
          <p className="text-center mt-2 font-medium dark:text-darkAccentGreen">
            Attach Rate: {attachRate.toFixed(1)}%
          </p>
        </div>
      </div>
      <div>
        <Line data={contributionChartData} />
      </div>
      <p className="text-center font-semibold mt-4 dark:text-darkAccentGreen">
        Overall Margin: {totalMarginPct}%
      </p>
    </div>
  );
}

export default React.memo(MenuPerformanceDashboard);
