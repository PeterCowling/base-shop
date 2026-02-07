/** @jest-environment node */
import path from "path";

jest.mock("@acme/date-utils", () => ({ nowIso: () => "2024-01-01T00:00:00.000Z" }));

const readShop = jest.fn();
const getShopSettings = jest.fn();
jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  readShop: (...args: any[]) => readShop(...args),
  getShopSettings: (...args: any[]) => getShopSettings(...args),
}));

const files = new Map<string, string>();
const readFile = jest.fn(async (p: string) => {
  const data = files.get(p);
  if (data === undefined) {
    const err = new Error("not found") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    throw err;
  }
  return data;
});
const writeFile = jest.fn(async (p: string, data: string) => {
  files.set(p, data);
});
const appendFile = jest.fn(async (p: string, data: string) => {
  const cur = files.get(p) || "";
  files.set(p, cur + data);
});
const mkdir = jest.fn(async () => {});

jest.mock("fs", () => ({ promises: { readFile, writeFile, appendFile, mkdir } }));

describe("analytics provider resolution", () => {
  const shop = "shop1";
  beforeEach(() => {
    jest.resetModules();
    readShop.mockReset();
    getShopSettings.mockReset();
    readFile.mockClear();
    writeFile.mockClear();
    appendFile.mockClear();
    mkdir.mockClear();
    files.clear();
    (globalThis.fetch as any) = jest.fn().mockResolvedValue({ ok: true });
    process.env.DATA_ROOT = "/data";
    delete process.env.GA_API_SECRET;
  });

  test("analytics disabled returns Noop provider", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: false });
    getShopSettings.mockResolvedValue({});
    const { trackEvent } = await import("@acme/platform-core/analytics");
    await trackEvent(shop, { type: "page_view", page: "/" });
    expect(appendFile).not.toHaveBeenCalled();
  });

  test("console provider logs event", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "console", enabled: true } });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const { trackEvent } = await import("@acme/platform-core/analytics");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(logSpy).toHaveBeenCalledWith(
      "analytics",
      expect.objectContaining({ type: "page_view", page: "home" })
    );
    logSpy.mockRestore();
  });

  test("ga provider requires measurementId and secret", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "G-XYZ" } });
    process.env.GA_API_SECRET = "secret";
    const fetchMock = globalThis.fetch as jest.Mock;
    const { trackEvent } = await import("@acme/platform-core/analytics");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("ga provider without secret falls back to FileProvider", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "G-XYZ" } });
    const fetchMock = globalThis.fetch as jest.Mock;
    const { trackEvent } = await import("@acme/platform-core/analytics");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(fetchMock).not.toHaveBeenCalled();
    const file = path.join("/data", shop, "analytics.jsonl");
    expect(files.get(file)).toContain("\"type\":\"page_view\"");
  });

  test("default FileProvider writes analytics.jsonl", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({});
    const { trackEvent } = await import("@acme/platform-core/analytics");
    await trackEvent(shop, { type: "page_view", page: "home" });
    const file = path.join("/data", shop, "analytics.jsonl");
    expect(files.get(file)).toContain("\"type\":\"page_view\"");
  });

  test("provider result is cached", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({});
    const { trackEvent } = await import("@acme/platform-core/analytics");
    await trackEvent(shop, { type: "page_view", page: "home" });
    await trackEvent(shop, { type: "page_view", page: "about" });
    expect(readShop).toHaveBeenCalledTimes(1);
    expect(getShopSettings).toHaveBeenCalledTimes(1);
    expect(appendFile).toHaveBeenCalledTimes(2);
  });

  test("updateAggregates increments metrics", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({});
    const { trackPageView, trackOrder, trackEvent } = await import("@acme/platform-core/analytics");
    await trackPageView(shop, "home");
    await trackOrder(shop, "o1", 5);
    await trackEvent(shop, { type: "discount_redeemed", code: "SAVE" });
    await trackEvent(shop, { type: "ai_crawl" });
    const aggPath = path.join("/data", shop, "analytics-aggregates.json");
    const agg = JSON.parse(files.get(aggPath)!);
    expect(agg.page_view["2024-01-01"]).toBe(1);
    expect(agg.order["2024-01-01"]).toEqual({ count: 1, amount: 5 });
    expect(agg.discount_redeemed["2024-01-01"].SAVE).toBe(1);
    expect(agg.ai_crawl["2024-01-01"]).toBe(1);
  });
});
