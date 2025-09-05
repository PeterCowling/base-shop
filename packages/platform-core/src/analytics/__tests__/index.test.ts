import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

jest.mock("@acme/date-utils", () => ({ nowIso: () => "2024-01-01T00:00:00.000Z" }));

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

  test("console provider logs event", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "console", enabled: true } });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(logSpy).toHaveBeenCalledWith("analytics", expect.objectContaining({ type: "page_view", page: "home" }));
    logSpy.mockRestore();
  });

  test("google analytics provider sends event when secrets provided", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "G-XYZ" } });
    process.env.GA_API_SECRET = "secret";
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis.fetch as any) = fetchMock;
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("https://www.google-analytics.com/mp/collect");
  });

  test("falls back to file provider when GA secrets missing", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "G-XYZ" } });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis.fetch as any) = fetchMock;
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(fetchMock).not.toHaveBeenCalled();
    const content = await fs.readFile(path.join(tmp, shop, "analytics.jsonl"), "utf8");
    expect(content).toContain("\"type\":\"page_view\"");
  });

  test("file provider writes analytics.jsonl by default", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    const content = await fs.readFile(path.join(tmp, shop, "analytics.jsonl"), "utf8");
    expect(content).toContain("\"type\":\"page_view\"");
  });
});


describe("updateAggregates persistence", () => {
  const shop = "agg-shop";
  let store: string | undefined;
  let readSpy: jest.SpyInstance;
  let writeSpy: jest.SpyInstance;
  let mkdirSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetModules();
    readShop.mockReset();
    getShopSettings.mockReset();
    store = undefined;
    readSpy = jest
      .spyOn(fs, "readFile")
      .mockImplementation(async () => {
        if (store === undefined) throw new Error("ENOENT");
        return store;
      });
    writeSpy = jest
      .spyOn(fs, "writeFile")
      .mockImplementation(async (_p, data) => {
        store = data as string;
      });
    mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
    process.env.DATA_ROOT = "/tmp";
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: "console", enabled: true },
    });
  });

  afterEach(() => {
    readSpy.mockRestore();
    writeSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  test("aggregates are updated for all event types", async () => {
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    await trackEvent(shop, { type: "order", orderId: "o1", amount: 5 });
    await trackEvent(shop, { type: "order", orderId: "o2" });
    await trackEvent(shop, { type: "discount_redeemed", code: "SAVE" });
    await trackEvent(shop, { type: "ai_crawl" });

    const agg = JSON.parse(store!);
    expect(agg.page_view["2024-01-01"]).toBe(1);
    expect(agg.order["2024-01-01"]).toEqual({ count: 2, amount: 5 });
    expect(agg.discount_redeemed["2024-01-01"].SAVE).toBe(1);
    expect(agg.ai_crawl["2024-01-01"]).toBe(1);
  });
});

describe("public tracking functions", () => {
  const shop = "track-shop";
  let store: string | undefined;
  let readSpy: jest.SpyInstance;
  let writeSpy: jest.SpyInstance;
  let mkdirSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.resetModules();
    readShop.mockReset();
    getShopSettings.mockReset();
    store = undefined;
    readSpy = jest
      .spyOn(fs, "readFile")
      .mockImplementation(async () => {
        if (store === undefined) throw new Error("ENOENT");
        return store;
      });
    writeSpy = jest
      .spyOn(fs, "writeFile")
      .mockImplementation(async (_p, data) => {
        store = data as string;
      });
    mkdirSpy = jest.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
    process.env.DATA_ROOT = "/tmp";
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: "console", enabled: true },
    });
  });

  afterEach(() => {
    readSpy.mockRestore();
    writeSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  test("trackEvent adds timestamp, delegates, and updates aggregates", async () => {
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
    const agg = JSON.parse(store!);
    expect(agg.page_view["2024-01-01"]).toBe(1);
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
    const agg = JSON.parse(store!);
    expect(agg.page_view["2024-01-01"]).toBe(1);
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
    const agg = JSON.parse(store!);
    expect(agg.order["2024-01-01"]).toEqual({ count: 1, amount: 42 });
    logSpy.mockRestore();
  });
});

