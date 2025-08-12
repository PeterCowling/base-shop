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

interface MultiSeries {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

function buildMetrics(
  events: AnalyticsEvent[],
  aggregates?: AnalyticsAggregates,
) {
  const emailOpenByDay: Record<string, number> = {};
  const emailClickByDay: Record<string, number> = {};
  const campaignSalesByDay: Record<string, number> = {};
  const campaignSalesCountByDay: Record<string, number> = {};
  const discountByCodeByDay: Record<string, Record<string, number>> = {};

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
    } else if (e.type === "discount_redeemed" && typeof (e as any).code === "string") {
      const code = (e as any).code as string;
      const entry = discountByCodeByDay[day] || {};
      entry[code] = (entry[code] || 0) + 1;
      discountByCodeByDay[day] = entry;
    }
  }

  const days = Array.from(
    new Set([
      ...(aggregates ? Object.keys(aggregates.page_view) : []),
      ...(aggregates ? Object.keys(aggregates.order) : []),
      ...Object.keys(emailOpenByDay),
      ...Object.keys(emailClickByDay),
      ...Object.keys(campaignSalesByDay),
      ...Object.keys(discountByCodeByDay),
      ...(aggregates ? Object.keys(aggregates.discount_redeemed) : []),
      ...(aggregates ? Object.keys(aggregates.ai_crawl) : []),
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
    data: days.map((d) => {
      const byCode = aggregates
        ? aggregates.discount_redeemed[d]
        : discountByCodeByDay[d];
      return byCode ? Object.values(byCode).reduce((a, b) => a + b, 0) : 0;
    }),
  };

  const codes = new Set<string>();
  if (aggregates) {
    for (const day of Object.keys(aggregates.discount_redeemed)) {
      for (const code of Object.keys(aggregates.discount_redeemed[day])) {
        codes.add(code);
      }
    }
  } else {
    for (const day of Object.keys(discountByCodeByDay)) {
      for (const code of Object.keys(discountByCodeByDay[day])) {
        codes.add(code);
      }
    }
  }

  const discountRedemptionsByCode = {
    labels: days,
    datasets: Array.from(codes).map((code) => ({
      label: code,
      data: days.map((d) => {
        const byCode = aggregates
          ? aggregates.discount_redeemed[d]
          : discountByCodeByDay[d];
        return byCode ? byCode[code] || 0 : 0;
      }),
    })),
  };

  const topDiscountCodes = Array.from(codes).map((code) => {
    const total = discountRedemptionsByCode.datasets
      .find((d) => d.label === code)!
      .data.reduce((a, b) => a + b, 0);
    return [code, total] as [string, number];
  }).sort((a, b) => b[1] - a[1]);

  const aiCrawl: Series = {
    labels: days,
    data: aggregates
      ? days.map((d) => aggregates.ai_crawl[d] || 0)
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
    aiCrawl: aiCrawl.data.reduce((a, b) => a + b, 0),
  };

  const maxTotal = Math.max(
    totals.emailOpens,
    totals.emailClicks,
    totals.campaignSales,
    totals.discountRedemptions,
    totals.aiCrawl,
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
    discountRedemptionsByCode,
    aiCrawl,
    totals,
    maxTotal,
    topDiscountCodes,
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
                discountRedemptionsByCode={metrics.discountRedemptionsByCode}
                aiCrawl={metrics.aiCrawl}
              />
              {metrics.topDiscountCodes.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 font-semibold">Top discount codes</h3>
                  <ul className="list-inside list-disc">
                    {metrics.topDiscountCodes.map(([code, count]) => (
                      <li key={code}>
                        {code}: {count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                    value={(metrics.totals.aiCrawl / metrics.maxTotal) * 100}
                    label={String(metrics.totals.aiCrawl)}
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
                discountRedemptionsByCode={metrics.discountRedemptionsByCode}
                aiCrawl={metrics.aiCrawl}
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

