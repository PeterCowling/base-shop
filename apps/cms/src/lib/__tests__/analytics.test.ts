import { buildMetrics } from "../analytics";
import type { AnalyticsEvent, AnalyticsAggregates } from "@platform-core/analytics";

describe("buildMetrics", () => {
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
    ];

    const metrics = buildMetrics(events);

    expect(metrics.conversion.data).toEqual([100, 100]);
    expect(metrics.aiCrawl.data).toEqual([0, 0]);
    expect(
      metrics.discountRedemptionsByCode.datasets.find((d) => d.label === "ABC")
        ?.data,
    ).toEqual([1, 1]);
  });
});

