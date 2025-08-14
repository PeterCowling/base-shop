import { buildMetrics } from "../analytics";
import type { AnalyticsEvent } from "@platform-core/analytics";

describe("buildMetrics", () => {
  it("aggregates analytics events", () => {
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

    expect(metrics.traffic.data).toEqual([1, 1]);
    expect(metrics.sales.data).toEqual([10, 20]);
    expect(metrics.emailOpens.data).toEqual([1, 0]);
    expect(metrics.emailClicks.data).toEqual([1, 1]);
    expect(metrics.campaignSales.data).toEqual([10, 20]);
    expect(metrics.discountRedemptions.data).toEqual([1, 2]);
    expect(
      metrics.discountRedemptionsByCode.datasets.find((d) => d.label === "ABC")
        ?.data,
    ).toEqual([1, 1]);
    expect(
      metrics.discountRedemptionsByCode.datasets.find((d) => d.label === "XYZ")
        ?.data,
    ).toEqual([0, 1]);
    expect(metrics.totals).toEqual(
      expect.objectContaining({
        emailOpens: 1,
        emailClicks: 2,
        campaignSales: 30,
        campaignSaleCount: 2,
        discountRedemptions: 3,
        aiCrawl: 0,
      }),
    );
    expect(metrics.maxTotal).toBe(30);
    expect(metrics.topDiscountCodes[0]).toEqual(["ABC", 2]);
  });
});

