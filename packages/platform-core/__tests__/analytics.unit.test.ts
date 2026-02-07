
describe("analytics core functions", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("caches resolved provider", async () => {
    const readShop = jest.fn().mockResolvedValue({ analyticsEnabled: true });
    const getShopSettings = jest
      .fn()
      .mockResolvedValue({ analytics: { provider: "console" } });
    jest.doMock("../src/repositories/shops.server", () => ({
      readShop,
      getShopSettings,
    }));
    const consoleLog = jest.spyOn(console, "debug").mockImplementation(() => {});
    const analytics = await import("../src/analytics");
    await analytics.trackEvent("shop", { type: "page_view" });
    await analytics.trackEvent("shop", { type: "page_view" });
    expect(readShop).toHaveBeenCalledTimes(1);
    expect(getShopSettings).toHaveBeenCalledTimes(1);
    consoleLog.mockRestore();
  });

  it("tracks events and updates aggregates", async () => {
    let stored: string | undefined;
    const readFile = jest.fn(async () => {
      if (stored) return stored;
      throw new Error("no file");
    });
    const writeFile = jest.fn(async (_fp: string, data: string) => {
      stored = data;
    });
    const mkdir = jest.fn().mockResolvedValue(undefined);
    const appendFile = jest.fn();
    jest.doMock("fs", () => ({ promises: { readFile, writeFile, mkdir, appendFile } }));
    const readShop = jest.fn().mockResolvedValue({ analyticsEnabled: true });
    const getShopSettings = jest
      .fn()
      .mockResolvedValue({ analytics: { provider: "console" } });
    jest.doMock("../src/repositories/shops.server", () => ({
      readShop,
      getShopSettings,
    }));
    const nowIso = jest
      .fn()
      .mockReturnValue("2023-01-01T00:00:00.000Z");
    jest.doMock("@acme/date-utils", () => ({ nowIso }));
    const consoleLog = jest.spyOn(console, "debug").mockImplementation(() => {});
    const analytics = await import("../src/analytics");
    await analytics.trackEvent("shop", { type: "page_view" });
    await analytics.trackPageView("shop", "/home");
    await analytics.trackEvent("shop", { type: "order", orderId: "o1", amount: 2 });
    await analytics.trackOrder("shop", "o2", 5);
    await analytics.trackEvent("shop", { type: "order", orderId: "o3" });
    await analytics.trackEvent("shop", { type: "discount_redeemed", code: "SAVE" });
    await analytics.trackEvent("shop", { type: "ai_crawl" });
    expect(nowIso).toHaveBeenCalledTimes(7);
    expect(consoleLog).toHaveBeenCalledTimes(7);
    expect(writeFile).toHaveBeenCalled();
    const agg = JSON.parse(stored!);
    const day = "2023-01-01";
    expect(agg.page_view[day]).toBe(2);
    expect(agg.order[day]).toEqual({ count: 3, amount: 7 });
    expect(agg.discount_redeemed[day].SAVE).toBe(1);
    expect(agg.ai_crawl[day]).toBe(1);
    consoleLog.mockRestore();
  });
});

