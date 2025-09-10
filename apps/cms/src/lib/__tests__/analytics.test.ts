import { buildMetrics } from "../analytics";
import type { AnalyticsEvent, AnalyticsAggregates } from "@platform-core/analytics";

describe("buildMetrics", () => {
  it("returns empty metrics for no events and no aggregates", () => {
    const metrics = buildMetrics([]);

    const emptySeries = { labels: [], data: [] };

    expect(metrics.traffic).toEqual(emptySeries);
    expect(metrics.sales).toEqual(emptySeries);
    expect(metrics.conversion).toEqual(emptySeries);
    expect(metrics.emailOpens).toEqual(emptySeries);
    expect(metrics.emailClicks).toEqual(emptySeries);
    expect(metrics.campaignSales).toEqual(emptySeries);
    expect(metrics.discountRedemptions).toEqual(emptySeries);
    expect(metrics.aiCrawl).toEqual(emptySeries);
    expect(metrics.discountRedemptionsByCode).toEqual({
      labels: [],
      datasets: [],
    });
    expect(metrics.totals).toEqual({
      emailOpens: 0,
      emailClicks: 0,
      campaignSales: 0,
      campaignSaleCount: 0,
      discountRedemptions: 0,
      aiCrawl: 0,
    });
  });
  it("computes metrics from aggregates", () => {
    const aggregates: AnalyticsAggregates = {
      page_view: {
        "2024-05-01": 100,
        "2024-05-02": 50,
      },
      order: {
        "2024-05-01": { amount: 500, count: 5 },
        "2024-05-02": { amount: 100, count: 1 },
      },
      discount_redeemed: {
        "2024-05-01": { SAVE10: 2 },
        "2024-05-02": { SAVE10: 1, SAVE20: 1 },
      },
      ai_crawl: {
        "2024-05-01": 3,
        "2024-05-02": 1,
      },
    };

    const metrics = buildMetrics([], aggregates);

    expect(metrics.conversion.data).toEqual([5, 2]);
    expect(
      metrics.discountRedemptionsByCode.datasets.find((d) => d.label === "SAVE10")
        ?.data,
    ).toEqual([2, 1]);
    expect(
      metrics.discountRedemptionsByCode.datasets.find((d) => d.label === "SAVE20")
        ?.data,
    ).toEqual([0, 1]);
    expect(metrics.aiCrawl.data).toEqual([3, 1]);
  });

  it("falls back to events when aggregates are absent", () => {
    const events: AnalyticsEvent[] = [
      { type: "email_open", timestamp: "2024-05-01T12:00:00Z" },
      { type: "email_click", timestamp: "2024-05-01T12:01:00Z" },
      { type: "email_click", timestamp: "2024-05-02T12:00:00Z" },
      {
        type: "campaign_sale",
        timestamp: "2024-05-01T12:02:00Z",
        amount: 10,
        campaign: "camp1",
      },
      {
        type: "campaign_sale",
        timestamp: "2024-05-02T12:03:00Z",
        amount: 20,
        campaign: "camp1",
      },
      {
        type: "discount_redeemed",
        timestamp: "2024-05-01T12:04:00Z",
        code: "ABC",
      },
      {
        type: "discount_redeemed",
        timestamp: "2024-05-02T12:04:00Z",
        code: "ABC",
      },
      {
        type: "discount_redeemed",
        timestamp: "2024-05-02T12:05:00Z",
        code: "XYZ",
      },
      // events with missing timestamp or code should be ignored
      { type: "email_open" },
      { type: "email_click" },
      { type: "campaign_sale", amount: 5 },
      { type: "discount_redeemed", timestamp: "2024-05-03T12:00:00Z" },
    ];

    const metrics = buildMetrics(events);

    expect(metrics.conversion.data).toEqual([100, 100]);
    expect(metrics.aiCrawl.data).toEqual([0, 0]);
    expect(
      metrics.discountRedemptionsByCode.datasets.find((d) => d.label === "ABC")
        ?.data,
    ).toEqual([1, 1]);
    expect(metrics.totals.emailOpens).toBe(1);
    expect(metrics.totals.emailClicks).toBe(2);
    expect(metrics.totals.discountRedemptions).toBe(3);
  });

  it("mixes aggregates with events and computes totals", () => {
    const events: AnalyticsEvent[] = [
      { type: "email_open", timestamp: "2024-05-01T12:00:00Z" },
      { type: "email_click", timestamp: "2024-05-01T12:01:00Z" },
      {
        type: "campaign_sale",
        timestamp: "2024-05-01T12:02:00Z",
        amount: 10,
        campaign: "camp1",
      },
      {
        type: "discount_redeemed",
        timestamp: "2024-05-01T12:03:00Z",
        code: "EVENT_ONLY",
      },
      { type: "email_open", timestamp: "2024-05-02T12:00:00Z" },
      { type: "email_click", timestamp: "2024-05-02T12:01:00Z" },
      {
        type: "campaign_sale",
        timestamp: "2024-05-02T12:02:00Z",
        amount: 20,
        campaign: "camp1",
      },
      {
        type: "discount_redeemed",
        timestamp: "2024-05-02T12:03:00Z",
        code: "EVENT_ONLY",
      },
    ];

    const aggregates: AnalyticsAggregates = {
      page_view: {
        "2024-05-01": 100,
        "2024-05-02": 50,
      },
      order: {
        "2024-05-01": { amount: 500, count: 5 },
        "2024-05-02": { amount: 100, count: 1 },
      },
      discount_redeemed: {
        "2024-05-01": { SAVE10: 2 },
        "2024-05-02": { SAVE10: 1, SAVE20: 1 },
      },
      ai_crawl: {
        "2024-05-01": 3,
        "2024-05-02": 1,
      },
    };

    const metrics = buildMetrics(events, aggregates);

    expect(metrics.traffic.data).toEqual([100, 50]);
    expect(metrics.emailOpens.data).toEqual([1, 1]);
    expect(metrics.totals).toEqual({
      emailOpens: 2,
      emailClicks: 2,
      campaignSales: 30,
      campaignSaleCount: 2,
      discountRedemptions: 4,
      aiCrawl: 4,
    });
    expect(metrics.maxTotal).toBe(30);
    expect(metrics.topDiscountCodes).toEqual([
      ["SAVE10", 3],
      ["SAVE20", 1],
    ]);
    expect(
      metrics.discountRedemptionsByCode.datasets.find((d) => d.label === "EVENT_ONLY"),
    ).toBeUndefined();
  });
});

