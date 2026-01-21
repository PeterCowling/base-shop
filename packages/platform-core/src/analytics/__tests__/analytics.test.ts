import * as path from "path";

jest.mock("@acme/date-utils", () => ({ nowIso: () => "2024-01-01T00:00:00.000Z" }));
jest.mock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));

const readShop = jest.fn();
const getShopSettings = jest.fn();
jest.mock("../../repositories/shops.server", () => ({
  readShop: (...args: unknown[]) => readShop(...args),
  getShopSettings: (...args: unknown[]) => getShopSettings(...args),
}));

jest.mock("fs", () => {
  const files: Record<string, string> = {};
  return {
    promises: {
      mkdir: jest.fn(async () => {}),
      appendFile: jest.fn(async (fp: string, data: string, _enc?: string) => {
        files[fp] = (files[fp] || "") + data;
      }),
      readFile: jest.fn(async (fp: string) => {
        if (files[fp] !== undefined) return files[fp];
        throw new Error("not found");
      }),
      writeFile: jest.fn(async (fp: string, data: string, _enc?: string) => {
        files[fp] = data;
      }),
      __files: files,
    },
  };
});

describe("analytics providers", () => {
  const shop = "shop";
  let fs: any;

  beforeEach(async () => {
    jest.resetModules();
    fs = (await import("fs")).promises as any;
    for (const k of Object.keys(fs.__files)) delete fs.__files[k];
    fs.mkdir.mockClear();
    fs.appendFile.mockClear();
    fs.readFile.mockClear();
    fs.writeFile.mockClear();
    readShop.mockReset();
    getShopSettings.mockReset();
    (globalThis.fetch as any) = jest.fn().mockResolvedValue({ ok: true });
    process.env.DATA_ROOT = "/data";
    delete process.env.GA_API_SECRET;
  });

  test("uses Noop provider when analytics disabled", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: false });
    getShopSettings.mockResolvedValue({});
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(fs.appendFile).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  test("uses console provider when configured", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "console", enabled: true } });
    const logSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(logSpy).toHaveBeenCalledWith(
      "analytics",
      expect.objectContaining({ type: "page_view", page: "home" })
    );
    logSpy.mockRestore();
  });

  test("falls back to file provider", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    const filePath = path.join("/data", shop, "analytics.jsonl");
    expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(filePath), { recursive: true });
    expect(fs.appendFile).toHaveBeenCalledWith(filePath, expect.any(String), "utf8");
    expect(fs.__files[filePath]).toContain("\"type\":\"page_view\"");
  });

  test("uses GA provider when secrets present", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "G-XYZ" } });
    process.env.GA_API_SECRET = "secret";
    const fetchMock = globalThis.fetch as jest.Mock;
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain("measurement_id=G-XYZ");
    expect(url).toContain("api_secret=secret");
    expect(opts).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(opts.body)).toEqual({
      client_id: "555",
      events: [{ name: "page_view", params: { page: "home" } }],
    });
  });

  test("caches resolved providers", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "console", enabled: true } });
    const logSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    await trackEvent(shop, { type: "page_view", page: "about" });
    expect(readShop).toHaveBeenCalledTimes(1);
    expect(getShopSettings).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(2);
    logSpy.mockRestore();
  });
});

describe("trackEvent behavior", () => {
  const shop = "shop";
  let fs: any;

  beforeEach(async () => {
    jest.resetModules();
    fs = (await import("fs")).promises as any;
    for (const k of Object.keys(fs.__files)) delete fs.__files[k];
    fs.appendFile.mockClear();
    fs.writeFile.mockClear();
    readShop.mockReset();
    getShopSettings.mockReset();
    (globalThis.fetch as any) = jest.fn().mockResolvedValue({ ok: true });
    process.env.DATA_ROOT = "/data";
    delete process.env.GA_API_SECRET;
  });

  test("writes aggregates for events", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    await trackEvent(shop, { type: "order", orderId: "o1", amount: 5 });
    await trackEvent(shop, { type: "discount_redeemed", code: "SAVE" });
    const aggPath = path.join("/data", shop, "analytics-aggregates.json");
    let agg = JSON.parse(fs.__files[aggPath]);
    expect(agg.page_view["2024-01-01"]).toBe(1);
    expect(agg.order["2024-01-01"]).toEqual({ count: 1, amount: 5 });
    expect(agg.discount_redeemed["2024-01-01"].SAVE).toBe(1);

    await trackEvent(shop, { type: "page_view", page: "about" });
    await trackEvent(shop, { type: "order", orderId: "o2", amount: 3 });
    await trackEvent(shop, { type: "discount_redeemed", code: "SAVE" });
    agg = JSON.parse(fs.__files[aggPath]);
    expect(agg.page_view["2024-01-01"]).toBe(2);
    expect(agg.order["2024-01-01"]).toEqual({ count: 2, amount: 8 });
    expect(agg.discount_redeemed["2024-01-01"].SAVE).toBe(2);
  });

  test("handles network errors gracefully", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "G-XYZ" } });
    process.env.GA_API_SECRET = "secret";
    (globalThis.fetch as jest.Mock).mockRejectedValue(new Error("network"));
    const { trackEvent } = await import("../index");
    await expect(trackEvent(shop, { type: "page_view", page: "home" })).resolves.toBeUndefined();
    const aggPath = path.join("/data", shop, "analytics-aggregates.json");
    expect(fs.__files[aggPath]).toBeDefined();
  });
});

describe("trackOrder amount handling", () => {
  const shop = "shop";
  let fs: any;

  beforeEach(async () => {
    jest.resetModules();
    fs = (await import("fs")).promises as any;
    for (const k of Object.keys(fs.__files)) delete fs.__files[k];
    fs.writeFile.mockClear();
    readShop.mockReset();
    getShopSettings.mockReset();
    process.env.DATA_ROOT = "/data";
  });

  test("tracks orders with and without amount", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const { trackOrder } = await import("../index");
    await trackOrder(shop, "o1", 5);
    await trackOrder(shop, "o2");
    const aggPath = path.join("/data", shop, "analytics-aggregates.json");
    const agg = JSON.parse(fs.__files[aggPath]);
    expect(agg.order["2024-01-01"]).toEqual({ count: 2, amount: 5 });
  });
});

describe("updateAggregates edge cases", () => {
  const shop = "shop";
  let fs: any;

  beforeEach(async () => {
    jest.resetModules();
    fs = (await import("fs")).promises as any;
    for (const k of Object.keys(fs.__files)) delete fs.__files[k];
    fs.writeFile.mockClear();
    readShop.mockReset();
    getShopSettings.mockReset();
    process.env.DATA_ROOT = "/data";
  });

  test("merges existing aggregates and validates fields", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const { trackOrder, trackEvent } = await import("../index");
    const aggPath = path.join("/data", shop, "analytics-aggregates.json");
    fs.__files[aggPath] = JSON.stringify({
      page_view: {},
      order: { "2024-01-01": { count: 1, amount: 5 } },
      discount_redeemed: { "2024-01-01": { SAVE: 1 } },
      ai_crawl: {},
    });

    await trackOrder(shop, "o2");
    await trackEvent(shop, { type: "discount_redeemed", code: "SAVE" });
    await trackEvent(shop, { type: "discount_redeemed" });

    const agg = JSON.parse(fs.__files[aggPath]);
    expect(agg.order["2024-01-01"]).toEqual({ count: 2, amount: 5 });
    expect(agg.discount_redeemed["2024-01-01"].SAVE).toBe(2);
    expect(Object.keys(agg.discount_redeemed["2024-01-01"])).toEqual(["SAVE"]);
  });
});
