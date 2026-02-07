import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";

jest.setTimeout(10000);

jest.mock("@acme/date-utils", () => ({
  nowIso: () => "2024-01-01T00:00:00.000Z",
}));

const readShop = jest.fn();
const getShopSettings = jest.fn();
jest.mock("../../repositories/shops.server", () => ({
  readShop: (...args: unknown[]) => readShop(...args),
  getShopSettings: (...args: unknown[]) => getShopSettings(...args),
}));

describe("updateAggregates persistence", () => {
  const shop = "agg-shop";
  let tmp: string;

  beforeEach(async () => {
    jest.resetModules();
    readShop.mockReset();
    getShopSettings.mockReset();
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "analytics-"));
    process.env.DATA_ROOT = tmp;
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
  });

  test("aggregates are updated for all event types", async () => {
    const { trackEvent, trackPageView, trackOrder } = await import("../index");
    await trackPageView(shop, "home");
    await trackOrder(shop, "o1", 5);
    await trackEvent(shop, { type: "discount_redeemed", code: "SAVE" });
    await trackEvent(shop, { type: "ai_crawl" });
    let agg = JSON.parse(
      await fs.readFile(
        path.join(tmp, shop, "analytics-aggregates.json"),
        "utf8"
      )
    );
    expect(agg.page_view["2024-01-01"]).toBe(1);
    expect(agg.order["2024-01-01"]).toEqual({ count: 1, amount: 5 });
    expect(agg.discount_redeemed["2024-01-01"].SAVE).toBe(1);
    expect(agg.ai_crawl["2024-01-01"]).toBe(1);
    expect(Object.keys(agg).sort()).toEqual([
      "ai_crawl",
      "discount_redeemed",
      "order",
      "page_view",
    ]);

    await trackPageView(shop, "about");
    await trackOrder(shop, "o2", 7);
    await trackEvent(shop, { type: "discount_redeemed", code: "SAVE" });
    await trackEvent(shop, { type: "ai_crawl" });
    agg = JSON.parse(
      await fs.readFile(
        path.join(tmp, shop, "analytics-aggregates.json"),
        "utf8"
      )
    );
    expect(agg.page_view["2024-01-01"]).toBe(2);
    expect(agg.order["2024-01-01"]).toEqual({ count: 2, amount: 12 });
    expect(agg.discount_redeemed["2024-01-01"].SAVE).toBe(2);
    expect(agg.ai_crawl["2024-01-01"]).toBe(2);
    expect(Object.keys(agg).sort()).toEqual([
      "ai_crawl",
      "discount_redeemed",
      "order",
      "page_view",
    ]);

    const expectedAgg = JSON.parse(JSON.stringify(agg));

    await trackEvent(shop, { type: "discount_redeemed" } as any);
    agg = JSON.parse(
      await fs.readFile(
        path.join(tmp, shop, "analytics-aggregates.json"),
        "utf8"
      )
    );
    expect(agg).toEqual(expectedAgg);
    expect(Object.keys(agg).sort()).toEqual([
      "ai_crawl",
      "discount_redeemed",
      "order",
      "page_view",
    ]);

    await trackEvent(shop, { type: "custom_event" } as any);
    agg = JSON.parse(
      await fs.readFile(
        path.join(tmp, shop, "analytics-aggregates.json"),
        "utf8"
      )
    );
    expect(agg).toEqual(expectedAgg);
    expect(Object.keys(agg).sort()).toEqual([
      "ai_crawl",
      "discount_redeemed",
      "order",
      "page_view",
    ]);

    const events = (
      await fs.readFile(path.join(tmp, shop, "analytics.jsonl"), "utf8")
    )
      .trim()
      .split(/\n+/)
      .map((l) => JSON.parse(l));
    expect(events.filter((e) => e.type === "page_view")).toHaveLength(2);
    expect(events.filter((e) => e.type === "order")).toHaveLength(2);
    expect(events.filter((e) => e.type === "discount_redeemed")).toHaveLength(
      3
    );
    expect(events.filter((e) => e.type === "custom_event")).toHaveLength(1);
    expect(events.filter((e) => e.type === "ai_crawl")).toHaveLength(2);
  });

  test("unknown event type still writes empty aggregates file", async () => {
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "custom_event" } as any);
    const aggPath = path.join(tmp, shop, "analytics-aggregates.json");
    const agg = JSON.parse(await fs.readFile(aggPath, "utf8"));
    expect(agg).toEqual({
      page_view: {},
      order: {},
      discount_redeemed: {},
      ai_crawl: {},
    });
  });

  test("merges with existing aggregate file", async () => {
    const aggPath = path.join(tmp, shop, "analytics-aggregates.json");
    await fs.mkdir(path.dirname(aggPath), { recursive: true });
    const existing = {
      page_view: { "2024-01-01": 5 },
      order: { "2024-01-01": { count: 2, amount: 50 } },
      discount_redeemed: { "2024-01-01": { SAVE: 1 } },
      ai_crawl: { "2024-01-01": 3 },
    };
    await fs.writeFile(aggPath, JSON.stringify(existing), "utf8");

    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    await trackEvent(shop, { type: "order", orderId: "o3", amount: 5 });
    await trackEvent(shop, { type: "discount_redeemed", code: "SAVE" });
    await trackEvent(shop, { type: "ai_crawl" });

    const agg = JSON.parse(await fs.readFile(aggPath, "utf8"));
    expect(agg.page_view["2024-01-01"]).toBe(6);
    expect(agg.order["2024-01-01"]).toEqual({ count: 3, amount: 55 });
    expect(agg.discount_redeemed["2024-01-01"].SAVE).toBe(2);
    expect(agg.ai_crawl["2024-01-01"]).toBe(4);
  });
});
