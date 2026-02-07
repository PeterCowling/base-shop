import type {
  AnalyticsAggregates,
  AnalyticsEvent,
} from "@acme/platform-core/analytics";

export interface Series {
  labels: string[];
  data: number[];
}

export interface MultiSeries {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

export function buildMetrics(
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
    } else if (e.type === "discount_redeemed") {
      const code = e.code;
      if (code) {
        const entry = discountByCodeByDay[day] || {};
        entry[code] = (entry[code] || 0) + 1;
        discountByCodeByDay[day] = entry;
      }
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
    data: days.map((d): number => {
      const byCode: Record<string, number> | undefined = aggregates
        ? aggregates.discount_redeemed[d]
        : discountByCodeByDay[d];
      if (!byCode) return 0;
      return Object.values(byCode).reduce(
        (a: number, b: number) => a + b,
        0,
      );
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

  const topDiscountCodes = Array.from(codes)
    .map((code) => {
      const total = discountRedemptionsByCode.datasets
        .find((d) => d.label === code)!
        .data.reduce((a, b) => a + b, 0);
      return [code, total] as [string, number];
    })
    .sort((a, b) => b[1] - a[1]);

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

