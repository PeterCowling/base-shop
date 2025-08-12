import {
  listEvents,
  readAggregates,
} from "@platform-core/repositories/analytics.server";
import { readShop } from "@platform-core/repositories/shops.server";
import { Progress } from "@acme/ui";
import { CampaignFilter } from "./CampaignFilter.client";
import { Charts } from "./Charts.client";

export default async function ShopDashboard({
  params,
  searchParams,
}: {
  params: { shop: string };
  searchParams: { campaign?: string | string[] };
}) {
  const shop = params.shop;
  const campaignParam = searchParams?.campaign;
  const selectedCampaigns = campaignParam
    ? Array.isArray(campaignParam)
      ? campaignParam
      : [campaignParam]
    : [];
  const [events, aggregates, shopData] = await Promise.all([
    listEvents(shop),
    readAggregates(shop),
    readShop(shop),
  ]);
  const domain = shopData.domain?.name;
  const domainStatus = shopData.domain?.status;
  const campaigns = Array.from(
    new Set(
      events
        .map((e) => (typeof e.campaign === "string" ? e.campaign : null))
        .filter(Boolean) as string[],
    ),
  );

  function buildSeries(
    eventList: typeof events,
    useAggregates: boolean,
  ) {
    const emailOpenByDay: Record<string, number> = {};
    const emailClickByDay: Record<string, number> = {};
    const campaignSalesByDay: Record<string, number> = {};
    const campaignSalesCountByDay: Record<string, number> = {};
    const discountByDay: Record<string, number> = {};
    for (const e of eventList) {
      const day = (e.timestamp || "").slice(0, 10);
      if (!day) continue;
      if (e.type === "email_open") {
        emailOpenByDay[day] = (emailOpenByDay[day] || 0) + 1;
      } else if (e.type === "email_click") {
        emailClickByDay[day] = (emailClickByDay[day] || 0) + 1;
      } else if (e.type === "campaign_sale") {
        const amount = typeof e.amount === "number" ? e.amount : 0;
        campaignSalesByDay[day] = (campaignSalesByDay[day] || 0) + amount;
        campaignSalesCountByDay[day] = (campaignSalesCountByDay[day] || 0) + 1;
      } else if (e.type === "discount_redeemed") {
        discountByDay[day] = (discountByDay[day] || 0) + 1;
      }
    }

    const days = Array.from(
      new Set([
        ...(useAggregates ? Object.keys(aggregates.page_view) : []),
        ...(useAggregates ? Object.keys(aggregates.order) : []),
        ...Object.keys(emailOpenByDay),
        ...Object.keys(emailClickByDay),
        ...Object.keys(campaignSalesByDay),
        ...Object.keys(discountByDay),
        ...(useAggregates ? Object.keys(aggregates.discount_redeemed) : []),
      ]),
    ).sort();

    const traffic = {
      labels: days,
      data: days.map((d) =>
        useAggregates ? aggregates.page_view[d] || 0 : emailClickByDay[d] || 0,
      ),
    };
    const sales = {
      labels: days,
      data: days.map((d) =>
        useAggregates ? aggregates.order[d]?.amount ?? 0 : campaignSalesByDay[d] || 0,
      ),
    };
    const conversion = {
      labels: days,
      data: days.map((d) => {
        if (useAggregates) {
          const views = aggregates.page_view[d] || 0;
          const orders = aggregates.order[d]?.count || 0;
          return views > 0 ? (orders / views) * 100 : 0;
        }
        const clicks = emailClickByDay[d] || 0;
        const salesCount = campaignSalesCountByDay[d] || 0;
        return clicks > 0 ? (salesCount / clicks) * 100 : 0;
      }),
    };
    const emailOpens = {
      labels: days,
      data: days.map((d) => emailOpenByDay[d] || 0),
    };
    const emailClicks = {
      labels: days,
      data: days.map((d) => emailClickByDay[d] || 0),
    };
    const campaignSales = {
      labels: days,
      data: days.map((d) => campaignSalesByDay[d] || 0),
    };
    const discountRedemptions = {
      labels: days,
      data: days.map((d) => discountByDay[d] || 0),
    };

    const totals = {
      emailOpens: emailOpens.data.reduce((a, b) => a + b, 0),
      emailClicks: emailClicks.data.reduce((a, b) => a + b, 0),
      campaignSales: campaignSales.data.reduce((a, b) => a + b, 0),
      discountRedemptions: discountRedemptions.data.reduce((a, b) => a + b, 0),
    };

    const totalSalesCount = Object.values(campaignSalesCountByDay).reduce(
      (a, b) => a + b,
      0,
    );
    const summary = {
      revenue: totals.campaignSales,
      traffic: totals.emailClicks,
      conversion:
        totals.emailClicks > 0 ? (totalSalesCount / totals.emailClicks) * 100 : 0,
    };

    return {
      traffic,
      sales,
      conversion,
      emailOpens,
      emailClicks,
      campaignSales,
      discountRedemptions,
      totals,
      summary,
    };
  }

  const filteredEvents = selectedCampaigns.length
    ? events.filter((e) => selectedCampaigns.includes(String(e.campaign)))
    : events;

  const aggregateSeries = buildSeries(filteredEvents, selectedCampaigns.length === 0);

  const seriesList = selectedCampaigns.length
    ? selectedCampaigns.map((c) => ({
        campaign: c,
        ...buildSeries(
          events.filter((e) => String(e.campaign) === c),
          false,
        ),
      }))
    : [{ campaign: null, ...aggregateSeries }];

  const totals = aggregateSeries.totals;
  const maxTotal = Math.max(
    totals.emailOpens,
    totals.emailClicks,
    totals.campaignSales,
    totals.discountRedemptions,
    1,
  );

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard: {shop}</h2>
      {domain && (
        <p className="mb-2 text-sm text-gray-600">
          Domain: {domain} {domainStatus ? `(${domainStatus})` : ""}
        </p>
      )}
      {campaigns.length > 0 && <CampaignFilter campaigns={campaigns} />}
      {seriesList.map(({ campaign, summary, ...charts }) => (
        <div key={campaign ?? "all"} className="mb-8">
          {campaign && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{campaign}</h3>
              <div className="flex gap-4 text-sm text-gray-700">
                <span>Traffic: {summary.traffic}</span>
                <span>Revenue: {summary.revenue.toFixed(2)}</span>
                <span>Conversion: {summary.conversion.toFixed(2)}%</span>
              </div>
            </div>
          )}
          <Charts
            traffic={charts.traffic}
            sales={charts.sales}
            conversion={charts.conversion}
            emailOpens={charts.emailOpens}
            emailClicks={charts.emailClicks}
            campaignSales={charts.campaignSales}
            discountRedemptions={charts.discountRedemptions}
          />
        </div>
      ))}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Progress</h3>
        <div>
          <span className="mb-1 block text-sm font-medium">Email opens</span>
          <Progress
            value={(totals.emailOpens / maxTotal) * 100}
            label={String(totals.emailOpens)}
          />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">Email clicks</span>
          <Progress
            value={(totals.emailClicks / maxTotal) * 100}
            label={String(totals.emailClicks)}
          />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">Campaign sales</span>
          <Progress
            value={(totals.campaignSales / maxTotal) * 100}
            label={String(totals.campaignSales)}
          />
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium">
            Discount redemptions
          </span>
          <Progress
            value={(totals.discountRedemptions / maxTotal) * 100}
            label={String(totals.discountRedemptions)}
          />
        </div>
      </div>
    </div>
  );
}
