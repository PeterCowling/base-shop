import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

jest.mock("@acme/date-utils", () => ({
  nowIso: () => "2024-01-01T00:00:00.000Z",
}));

const readShop = jest.fn();
const getShopSettings = jest.fn();
jest.mock("../../repositories/shops.server", () => ({
  readShop: (...args: unknown[]) => readShop(...args),
  getShopSettings: (...args: unknown[]) => getShopSettings(...args),
}));

describe("trackEvent providers", () => {
  const shop = "test-shop";
  let tmp: string;

  beforeEach(async () => {
    jest.resetModules();
    readShop.mockReset();
    getShopSettings.mockReset();
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "analytics-"));
    process.env.DATA_ROOT = tmp;
    delete process.env.GA_API_SECRET;
    (globalThis.fetch as any) = jest.fn().mockResolvedValue({ ok: true });
  });

  test("analytics disabled uses Noop provider", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: false });
    getShopSettings.mockResolvedValue({});
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    const file = path.join(tmp, shop, "analytics.jsonl");
    await expect(fs.readFile(file, "utf8")).rejects.toBeDefined();
  });

  test("analytics provider 'none' uses Noop provider and is cached", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "none" } });
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    await trackEvent(shop, { type: "page_view", page: "about" });
    expect(readShop).toHaveBeenCalledTimes(1);
    expect(getShopSettings).toHaveBeenCalledTimes(1);
    const file = path.join(tmp, shop, "analytics.jsonl");
    await expect(fs.readFile(file, "utf8")).rejects.toBeDefined();
  });

  test("console provider logs events and is cached", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: "console", enabled: true },
    });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    await trackEvent(shop, { type: "page_view", page: "about" });
    expect(readShop).toHaveBeenCalledTimes(1);
    expect(getShopSettings).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith(
      "analytics",
      expect.objectContaining({ type: "page_view", page: "home" })
    );
    expect(logSpy).toHaveBeenCalledWith(
      "analytics",
      expect.objectContaining({ type: "page_view", page: "about" })
    );
    logSpy.mockRestore();
  });

  test("google analytics provider sends event when secrets provided", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: "ga", id: "G-XYZ" },
    });
    process.env.GA_API_SECRET = "secret";
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis.fetch as any) = fetchMock;
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "https://www.google-analytics.com/mp/collect"
    );
  });

  test("falls back to file provider when GA secrets missing", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: "ga", id: "G-XYZ" },
    });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis.fetch as any) = fetchMock;
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(fetchMock).not.toHaveBeenCalled();
    const content = await fs.readFile(
      path.join(tmp, shop, "analytics.jsonl"),
      "utf8"
    );
    expect(content).toContain('"type":"page_view"');
  });

  test("file provider writes analytics.jsonl by default", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    const content = await fs.readFile(
      path.join(tmp, shop, "analytics.jsonl"),
      "utf8"
    );
    expect(content).toContain('"type":"page_view"');
  });

  test("file provider is cached", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    await trackEvent(shop, { type: "page_view", page: "about" });
    expect(readShop).toHaveBeenCalledTimes(1);
    expect(getShopSettings).toHaveBeenCalledTimes(1);
    const content = await fs.readFile(
      path.join(tmp, shop, "analytics.jsonl"),
      "utf8"
    );
    expect(content.split("\n").filter(Boolean)).toHaveLength(2);
  });
});

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

    const events = (
      await fs.readFile(path.join(tmp, shop, "analytics.jsonl"), "utf8")
    )
      .trim()
      .split(/\n+/)
      .map((l) => JSON.parse(l));
    expect(events.filter((e) => e.type === "page_view")).toHaveLength(2);
    expect(events.filter((e) => e.type === "order")).toHaveLength(2);
    expect(events.filter((e) => e.type === "discount_redeemed")).toHaveLength(
      2
    );
    expect(events.filter((e) => e.type === "ai_crawl")).toHaveLength(2);
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

describe("public tracking functions", () => {
  const shop = "track-shop";
  let tmp: string;

  beforeEach(async () => {
    jest.resetModules();
    readShop.mockReset();
    getShopSettings.mockReset();
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "analytics-"));
    process.env.DATA_ROOT = tmp;
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: "console", enabled: true },
    });
  });

  test("trackEvent adds timestamp and delegates to provider", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(logSpy).toHaveBeenCalledWith(
      "analytics",
      expect.objectContaining({
        type: "page_view",
        page: "home",
        timestamp: "2024-01-01T00:00:00.000Z",
      })
    );
    logSpy.mockRestore();
  });

  test("trackPageView wraps trackEvent", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { trackPageView } = await import("../index");
    await trackPageView(shop, "home");
    expect(logSpy).toHaveBeenCalledWith(
      "analytics",
      expect.objectContaining({
        type: "page_view",
        page: "home",
        timestamp: "2024-01-01T00:00:00.000Z",
      })
    );
    logSpy.mockRestore();
  });

  test("trackOrder wraps trackEvent", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { trackOrder } = await import("../index");
    await trackOrder(shop, "o1", 42);
    expect(logSpy).toHaveBeenCalledWith(
      "analytics",
      expect.objectContaining({
        type: "order",
        orderId: "o1",
        amount: 42,
        timestamp: "2024-01-01T00:00:00.000Z",
      })
    );
    logSpy.mockRestore();
  });
});
