import { readAggregates } from "@platform-core/repositories/analytics.server";
import { readShop } from "@platform-core/repositories/shops.server";
import { Charts } from "./Charts.client";

export default async function ShopDashboard({
  params,
}: {
  params: { shop: string };
}) {
  const shop = params.shop;
  const [aggregates, shopData] = await Promise.all([
    readAggregates(shop),
    readShop(shop),
  ]);
  const domain = shopData.domain?.name;
  const domainStatus = shopData.domain?.status;

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

  const redemptions = Object.entries(aggregates.discount || {});

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard: {shop}</h2>
      {domain && (
        <p className="mb-2 text-sm text-gray-600">
          Domain: {domain} {domainStatus ? `(${domainStatus})` : ""}
        </p>
      )}
      <Charts traffic={traffic} sales={sales} conversion={conversion} />
      {redemptions.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 font-semibold">Discount Redemptions</h3>
          <ul className="list-disc pl-6">
            {redemptions.map(([code, count]) => (
              <li key={code}>
                {code}: {count}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
