import type { AnalyticsEvent } from "@acme/platform-core/analytics";

import {
  buildHbagPdpFunnelFeed,
  HBAG_PDP_FUNNEL_ALIAS_VERSION,
  HBAG_PDP_FUNNEL_KPI_ALIASES,
  mapRawEventName,
  renderHbagPdpFunnelFeedMarkdown,
} from "../diagnostics/hbag-pdp-funnel-feed";

describe("hbag-pdp-funnel-feed", () => {
  it("locks the KPI alias contract", () => {
    expect(HBAG_PDP_FUNNEL_ALIAS_VERSION).toBe("hbag-pdp-funnel.v1");
    expect(HBAG_PDP_FUNNEL_KPI_ALIASES).toEqual({
      product_view: "view_item",
      checkout_started: "begin_checkout",
    });
    expect(mapRawEventName("product_view")).toBe("view_item");
    expect(mapRawEventName("checkout_started")).toBe("begin_checkout");
    expect(mapRawEventName("unknown")).toBeNull();
  });

  it("computes counts and rate only for mapped events in window", () => {
    const events: AnalyticsEvent[] = [
      { type: "product_view", timestamp: "2026-03-03T10:00:00.000Z" },
      { type: "product_view", timestamp: "2026-03-04T09:00:00.000Z" },
      { type: "checkout_started", timestamp: "2026-03-04T09:05:00.000Z" },
      { type: "checkout_started", timestamp: "2026-02-20T09:05:00.000Z" },
      { type: "page_view", timestamp: "2026-03-04T08:00:00.000Z" },
      { type: "product_view" }, // ignored: no timestamp
    ];

    const feed = buildHbagPdpFunnelFeed({
      events,
      generatedAt: new Date("2026-03-04T12:00:00.000Z"),
      asOfDate: new Date("2026-03-04T12:00:00.000Z"),
      windowDays: 7,
      sourceShop: "caryina",
    });

    expect(feed.schema_version).toBe("hbag-pdp-funnel-feed.v1");
    expect(feed.alias_contract_version).toBe("hbag-pdp-funnel.v1");
    expect(feed.window).toEqual({
      start_inclusive: "2026-02-26",
      end_exclusive: "2026-03-05",
      days: 7,
    });
    expect(feed.metrics).toEqual({
      view_item_count: 2,
      begin_checkout_count: 1,
      begin_checkout_rate: 0.5,
    });
  });

  it("renders required markdown fields", () => {
    const feed = buildHbagPdpFunnelFeed({
      events: [],
      generatedAt: new Date("2026-03-04T12:00:00.000Z"),
      asOfDate: new Date("2026-03-04T12:00:00.000Z"),
      windowDays: 7,
      sourceShop: "caryina",
    });

    const md = renderHbagPdpFunnelFeedMarkdown(feed);
    expect(md).toContain("Type: Baseline");
    expect(md).toContain("## KPI Alias Contract");
    expect(md).toContain("`product_view -> view_item`");
    expect(md).toContain("`checkout_started -> begin_checkout`");
    expect(md).toContain("`view_item_count`");
    expect(md).toContain("`begin_checkout_count`");
    expect(md).toContain("`begin_checkout_rate`");
  });
});
