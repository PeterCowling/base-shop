import {
  listEvents,
  readAggregates,
} from "@platform-core/repositories/analytics.server";
import { readShop } from "@platform-core/repositories/shops.server";
import { Progress } from "@acme/ui";
import { CampaignFilter } from "./CampaignFilter.client";
import { Charts } from "./Charts.client";
import type {
  AnalyticsAggregates,
  AnalyticsEvent,
} from "@platform-core/analytics";

interface Series {
  labels: string[];
  data: number[];
}

function buildMetrics(
  events: AnalyticsEvent[],
  aggregates?: AnalyticsAggregates,
) {
  const emailOpenByDay: Record<string, number> = {};
  const emailClickByDay: Record<string, number> = {};
  const campaignSalesByDay: Record<string, number> = {};
  const campaignSalesCountByDay: Record<string, number> = {};
  const discountByDay: Record<string, number> = {};

  for (const e of events) {
    const day = (e.timestamp || "").slice(0, 10);
    if (!day) continue;
    if (e.type === "email_open") {
      emailOpenByDay[day] = (emailOpenByDay[day] || 0) + 1;
    } else if (e.type === "email_click") {
      emailClickByDay[day] = (emailClickByDay[day] || 0) + 1;
    } else if (e.type === "campaign_sale") {
      const amount = typeof e.amount === "number" ? e.amount : 0;
      campaignSalesByDay[day] = (campaignSalesByDay[day] || 0) + amount;
      campaignSalesCountByDay[day] =
        (campaignSalesCountByDay[day] || 0) + 1;
    } else if (e.type === "discount_redeemed") {
      discountByDay[day] = (discountByDay[day] || 0) + 1;
    }
  }

  const days = Array.from(
    new Set([
      ...(aggregates ? Object.keys(aggregates.page_view) : []),
      ...(aggregates ? Object.keys(aggregates.order) : []),
      ...Object.keys(emailOpenByDay),
      ...Object.keys(emailClickByDay),
      ...Object.keys(campaignSalesByDay),
      ...Object.keys(discountByDay),
      ...(aggregates ? Object.keys(aggregates.discount_redeemed) : []),
      ...(aggregates ? Object.keys(aggregates.ai_catalog) : []),
    ]),
  ).sort();

  const traffic: Series = {
    labels: days,
    data: aggregates
      ? days.map((d) => aggregates.page_view[d] || 0)
      : days.map((d) => emailClickByDay[d] || 0),
  };

  const sales: Series = {
    labels: days,
    data: aggregates
      ? days.map((d) => aggregates.order[d]?.amount ?? 0)
      : days.map((d) => campaignSalesByDay[d] || 0),
  };

  const conversion: Series = {
    labels: days,
    data: aggregates
      ? days.map((d) => {
          const views = aggregates.page_view[d] || 0;
          const orders = aggregates.order[d]?.count || 0;
          return views > 0 ? (orders / views) * 100 : 0;
        })
      : days.map((d) => {
          const clicks = emailClickByDay[d] || 0;
          const salesCount = campaignSalesCountByDay[d] || 0;
          return clicks > 0 ? (salesCount / clicks) * 100 : 0;
        }),
  };

  const emailOpens: Series = {
    labels: days,
    data: days.map((d) => emailOpenByDay[d] || 0),
  };

  const emailClicks: Series = {
    labels: days,
    data: days.map((d) => emailClickByDay[d] || 0),
  };

  const campaignSales: Series = {
    labels: days,
    data: days.map((d) => campaignSalesByDay[d] || 0),
  };

  const discountRedemptions: Series = {
    labels: days,
    data: days.map((d) => discountByDay[d] || 0),
  };

  const aiCatalog: Series = {
    labels: days,
    data: aggregates
      ? days.map((d) => aggregates.ai_catalog[d] || 0)
      : days.map(() => 0),
  };

  const totals = {
    emailOpens: emailOpens.data.reduce((a, b) => a + b, 0),
    emailClicks: emailClicks.data.reduce((a, b) => a + b, 0),
    campaignSales: campaignSales.data.reduce((a, b) => a + b, 0),
    campaignSaleCount: Object.values(campaignSalesCountByDay).reduce(
      (a, b) => a + b,
      0,
    ),
    discountRedemptions: discountRedemptions.data.reduce((a, b) => a + b, 0),
    aiCatalog: aiCatalog.data.reduce((a, b) => a + b, 0),
  };

  const maxTotal = Math.max(
    totals.emailOpens,
    totals.emailClicks,
    totals.campaignSales,
    totals.discountRedemptions,
    totals.aiCatalog,
    1,
  );

  return {
    traffic,
    sales,
    conversion,
    emailOpens,
    emailClicks,
    campaignSales,
    discountRedemptions,
    aiCatalog,
    totals,
    maxTotal,
  };
}

export default async function ShopDashboard({
  params,
  searchParams,
}: {
  params: { shop: string };
  searchParams: { campaign?: string | string[] };
}) {
  const shop = params.shop;
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

  const selected = searchParams?.campaign;
  const selectedCampaigns = Array.isArray(selected)
    ? selected
    : selected
      ? [selected]
      : [];

  const content =
    selectedCampaigns.length === 0
      ? (() => {
          const metrics = buildMetrics(events, aggregates);
          return (
            <>
              <Charts
                traffic={metrics.traffic}
                sales={metrics.sales}
                conversion={metrics.conversion}
                emailOpens={metrics.emailOpens}
                emailClicks={metrics.emailClicks}
                campaignSales={metrics.campaignSales}
                discountRedemptions={metrics.discountRedemptions}
                aiCatalog={metrics.aiCatalog}
              />
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold">Progress</h3>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Email opens
                  </span>
                  <Progress
                    value={(metrics.totals.emailOpens / metrics.maxTotal) * 100}
                    label={String(metrics.totals.emailOpens)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Email clicks
                  </span>
                  <Progress
                    value={(metrics.totals.emailClicks / metrics.maxTotal) * 100}
                    label={String(metrics.totals.emailClicks)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Campaign sales
                  </span>
                  <Progress
                    value={(metrics.totals.campaignSales / metrics.maxTotal) * 100}
                    label={String(metrics.totals.campaignSales)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Discount redemptions
                  </span>
                  <Progress
                    value={
                      (metrics.totals.discountRedemptions / metrics.maxTotal) *
                      100
                    }
                    label={String(metrics.totals.discountRedemptions)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    AI catalog requests
                  </span>
                  <Progress
                    value={(metrics.totals.aiCatalog / metrics.maxTotal) * 100}
                    label={String(metrics.totals.aiCatalog)}
                  />
                </div>
              </div>
            </>
          );
        })()
      : selectedCampaigns.map((c) => {
          const metrics = buildMetrics(events.filter((e) => e.campaign === c));
          const totalTraffic = metrics.totals.emailClicks;
          const totalRevenue = metrics.totals.campaignSales;
          const conversionRate =
            totalTraffic > 0
              ? (metrics.totals.campaignSaleCount / totalTraffic) * 100
              : 0;
          return (
            <div key={c} className="mb-8">
              <h3 className="text-lg font-semibold">Campaign: {c}</h3>
              <p className="mb-2 text-sm">
                Traffic: {totalTraffic} • Revenue: {totalRevenue.toFixed(2)} •
                Conversion: {conversionRate.toFixed(2)}%
              </p>
              <Charts
                traffic={metrics.traffic}
                sales={metrics.sales}
                conversion={metrics.conversion}
                emailOpens={metrics.emailOpens}
                emailClicks={metrics.emailClicks}
                campaignSales={metrics.campaignSales}
                discountRedemptions={metrics.discountRedemptions}
                aiCatalog={metrics.aiCatalog}
              />
            </div>
          );
        });

  return (
  <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard: {shop}</h2>
      {domain && (
        <p className="mb-2 text-sm text-gray-600">
          Domain: {domain} {domainStatus ? `(${domainStatus})` : ""}
        </p>
      )}
      {campaigns.length > 0 && <CampaignFilter campaigns={campaigns} />}
      {content}
    </div>
  );
}

