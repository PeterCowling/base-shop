// apps/cms/src/app/cms/dashboard/page.tsx
import { listShops } from "../listShops";
import { resolveDataRoot } from "@platform-core/dataRoot";
import fs from "node:fs/promises";
import path from "node:path";
import DashboardCharts from "./DashboardCharts.client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics Dashboard · Base-Shop",
};

export default async function AnalyticsDashboardPage() {
  const shops = await listShops();
  const dataRoot = resolveDataRoot();

  const sales: Record<string, number> = {};
  const traffic: Record<string, number> = {};

  await Promise.all(
    shops.map(async (shop) => {
      const file = path.join(dataRoot, shop, "analytics.jsonl");
      try {
        const buf = await fs.readFile(file, "utf8");
        for (const line of buf.trim().split(/\n+/)) {
          if (!line) continue;
          const evt = JSON.parse(line) as {
            type: string;
            timestamp: string;
            amount?: number;
          };
          const day = evt.timestamp.slice(0, 10);
          if (evt.type === "order" && typeof evt.amount === "number") {
            sales[day] = (sales[day] ?? 0) + evt.amount;
          } else if (evt.type === "page_view") {
            traffic[day] = (traffic[day] ?? 0) + 1;
          }
        }
      } catch {
        /* ignore missing analytics */
      }
    })
  );

  const salesData = Object.keys(sales)
    .sort()
    .map((d) => ({ date: d, value: sales[d] }));
  const trafficData = Object.keys(traffic)
    .sort()
    .map((d) => ({ date: d, value: traffic[d] }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics</h2>
      <DashboardCharts sales={salesData} traffic={trafficData} />
    </div>
  );
}
