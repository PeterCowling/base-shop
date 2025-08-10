import { readAggregates } from "@platform-core/repositories/analytics.server";
import { Charts } from "./Charts.client";

export default async function ShopDashboard({
  params,
}: {
  params: { shop: string };
}) {
  const shop = params.shop;
  const aggregates = await readAggregates(shop);

  const days = Array.from(
    new Set([
      ...Object.keys(aggregates.page_view),
      ...Object.keys(aggregates.order),
    ])
  ).sort();

  const traffic = {
    labels: days,
    data: days.map((d) => aggregates.page_view[d] || 0),
  };
  const sales = {
    labels: days,
    data: days.map((d) => (aggregates.order[d]?.amount ?? 0)),
  };
  const conversion = {
    labels: days,
    data: days.map((d) => {
      const views = aggregates.page_view[d] || 0;
      const orders = aggregates.order[d]?.count || 0;
      return views > 0 ? (orders / views) * 100 : 0;
    }),
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard: {shop}</h2>
      <Charts traffic={traffic} sales={sales} conversion={conversion} />
    </div>
  );
}
