import { listEvents } from "@platform-core/repositories/analytics.server";
import { readOrders } from "@platform-core/repositories/rentalOrders.server";
import { ChartSection } from "./Chart";

function groupByDay<T>(items: T[], getDate: (item: T) => string | undefined) {
  const map: Record<string, number> = {};
  for (const item of items) {
    const d = getDate(item)?.slice(0, 10);
    if (!d) continue;
    map[d] = (map[d] || 0) + 1;
  }
  return map;
}

export default async function ShopDashboard({
  params,
}: {
  params: { shop: string };
}) {
  const shop = params.shop;
  const [events, orders] = await Promise.all([
    listEvents(shop),
    readOrders(shop),
  ]);

  const views = groupByDay(
    events.filter((e) => e.type === "page_view"),
    (e) => e.timestamp as string
  );
  const sales = groupByDay(orders, (o) => o.startedAt);

  const days = Array.from(new Set([...Object.keys(views), ...Object.keys(sales)])).sort();
  const trafficData = days.map((d) => views[d] || 0);
  const salesData = days.map((d) => sales[d] || 0);
  const conversionData = days.map((d) => {
    const v = views[d] || 0;
    const s = sales[d] || 0;
    return v ? (s / v) * 100 : 0;
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard: {shop}</h2>
      <ChartSection
        title="Traffic"
        label="Page views"
        labels={days}
        data={trafficData}
      />
      <ChartSection
        title="Sales"
        label="Orders"
        labels={days}
        data={salesData}
      />
      <ChartSection
        title="Conversion"
        label="%"
        labels={days}
        data={conversionData}
      />
    </div>
  );
}
