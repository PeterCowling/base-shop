import { buildMetrics } from "../analytics";
import type { AnalyticsEvent, AnalyticsAggregates } from "@platform-core/analytics";

describe("buildMetrics", () => {
  it("builds metrics from events without aggregates", () => {
    const events: AnalyticsEvent[] = [
      { type: "email_open", timestamp: "2024-05-01T00:00:00Z" },
      { type: "email_click", timestamp: "2024-05-01T00:01:00Z" },
      { type: "campaign_sale", timestamp: "2024-05-01T00:02:00Z", amount: 100 },
      { type: "discount_redeemed", timestamp: "2024-05-01T00:03:00Z", code: "CODE1" },
      { type: "campaign_sale", timestamp: "2024-05-02T00:00:00Z", amount: 50 },
      { type: "discount_redeemed", timestamp: "2024-05-02T00:01:00Z", code: "CODE1" },
      { type: "email_open", timestamp: "2024-05-03T00:00:00Z" },
      { type: "email_click", timestamp: "2024-05-03T00:01:00Z" },
    ];

    const metrics = buildMetrics(events);

    expect(metrics.traffic).toEqual({
      labels: ["2024-05-01", "2024-05-02", "2024-05-03"],
      data: [1, 0, 1],
    });
    expect(metrics.sales).toEqual({
      labels: ["2024-05-01", "2024-05-02", "2024-05-03"],
      data: [100, 50, 0],
    });
    expect(metrics.conversion).toEqual({
      labels: ["2024-05-01", "2024-05-02", "2024-05-03"],
      data: [100, 0, 0],
    });
    expect(metrics.emailOpens.data).toEqual([1, 0, 1]);
    expect(metrics.emailClicks.data).toEqual([1, 0, 1]);
    expect(metrics.campaignSales.data).toEqual([100, 50, 0]);
    expect(metrics.discountRedemptions.data).toEqual([1, 1, 0]);
    expect(metrics.discountRedemptionsByCode).toEqual({
      labels: ["2024-05-01", "2024-05-02", "2024-05-03"],
      datasets: [{ label: "CODE1", data: [1, 1, 0] }],
    });
    expect(metrics.aiCrawl.data).toEqual([0, 0, 0]);
  });

  it("builds metrics from aggregates with missing entries", () => {
    const events: AnalyticsEvent[] = [
      { type: "email_open", timestamp: "2024-05-01T00:00:00Z" },
      { type: "email_click", timestamp: "2024-05-01T00:01:00Z" },
      { type: "campaign_sale", timestamp: "2024-05-01T00:02:00Z", amount: 100 },
      { type: "discount_redeemed", timestamp: "2024-05-01T00:03:00Z", code: "EVENT_ONLY" },
      { type: "email_open", timestamp: "2024-05-02T00:00:00Z" },
      { type: "email_click", timestamp: "2024-05-03T00:00:00Z" },
      { type: "campaign_sale", timestamp: "2024-05-04T00:00:00Z", amount: 30 },
    ];

    const aggregates: AnalyticsAggregates = {
      page_view: {
        "2024-05-01": 10,
        "2024-05-02": 0,
        "2024-05-03": 5,
      },
      order: {
        "2024-05-01": { amount: 100, count: 1 },
        "2024-05-04": { amount: 30, count: 1 },
      },
      discount_redeemed: {
        "2024-05-01": { CODE1: 1 },
        "2024-05-03": { CODE2: 2 },
      },
      ai_crawl: {
        "2024-05-02": 1,
      },
    };

    const metrics = buildMetrics(events, aggregates);

    expect(metrics.traffic).toEqual({
      labels: ["2024-05-01", "2024-05-02", "2024-05-03", "2024-05-04"],
      data: [10, 0, 5, 0],
    });
    expect(metrics.sales).toEqual({
      labels: ["2024-05-01", "2024-05-02", "2024-05-03", "2024-05-04"],
      data: [100, 0, 0, 30],
    });
    expect(metrics.conversion).toEqual({
      labels: ["2024-05-01", "2024-05-02", "2024-05-03", "2024-05-04"],
      data: [10, 0, 0, 0],
    });
    expect(metrics.emailOpens.data).toEqual([1, 1, 0, 0]);
    expect(metrics.emailClicks.data).toEqual([1, 0, 1, 0]);
    expect(metrics.campaignSales.data).toEqual([100, 0, 0, 30]);
    expect(metrics.discountRedemptions.data).toEqual([1, 0, 2, 0]);
    expect(metrics.discountRedemptionsByCode).toEqual({
      labels: ["2024-05-01", "2024-05-02", "2024-05-03", "2024-05-04"],
      datasets: [
        { label: "CODE1", data: [1, 0, 0, 0] },
        { label: "CODE2", data: [0, 0, 2, 0] },
      ],
    });
    expect(metrics.aiCrawl.data).toEqual([0, 1, 0, 0]);
  });
});

