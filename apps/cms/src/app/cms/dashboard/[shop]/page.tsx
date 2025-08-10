import { listEvents } from "@platform-core/repositories/analytics.server";
import { readOrders } from "@platform-core/repositories/rentalOrders.server";
import { getShopDomain } from "@platform-core/src/shops";

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
  const [events, orders, domainInfo] = await Promise.all([
    listEvents(shop),
    readOrders(shop),
    getShopDomain(shop),
  ]);

  const views = groupByDay(
    events.filter((e) => e.type === "page_view"),
    (e) => e.timestamp as string
  );
  const sales = groupByDay(orders, (o) => o.startedAt);

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard: {shop}</h2>
      <section className="mb-6">
        <h3 className="font-semibold">Domain</h3>
        {domainInfo?.domain ? (
          <p>{domainInfo.domain}</p>
        ) : (
          <p>No domain configured</p>
        )}
      </section>
      <section className="mb-6">
        <h3 className="font-semibold">Sales</h3>
        <ul>
          {Object.entries(sales).map(([day, count]) => (
            <li key={day}>
              {day}: {count}
            </li>
          ))}
          {Object.keys(sales).length === 0 && <li>No orders</li>}
        </ul>
      </section>
      <section>
        <h3 className="font-semibold">Traffic</h3>
        <ul>
          {Object.entries(views).map(([day, count]) => (
            <li key={day}>
              {day}: {count}
            </li>
          ))}
          {Object.keys(views).length === 0 && <li>No page views</li>}
        </ul>
      </section>
    </div>
  );
}
