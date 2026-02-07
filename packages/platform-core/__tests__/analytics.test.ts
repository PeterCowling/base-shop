// packages/platform-core/__tests__/analytics.test.ts
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";


type AnalyticsModule = typeof import("../src/analytics");

interface Mocks {
  readShop: jest.Mock;
  getShopSettings: jest.Mock;
  fetch: jest.Mock;
}

jest.setTimeout(15000);

async function withAnalytics(
  cb: (
    analytics: AnalyticsModule,
    mocks: Mocks,
    dir: string
  ) => Promise<void>,
  opts: { now?: string } = {}
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "analytics-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  const originalFetch = (global as any).fetch;
  const fetch = jest.fn().mockResolvedValue({ ok: true });
  (global as any).fetch = fetch;

  const readShop = jest.fn();
  const getShopSettings = jest.fn();
  jest.doMock("../src/repositories/shops.server", () => ({
    readShop,
    getShopSettings,
  }));

  if (opts.now) {
    jest.doMock("@acme/date-utils", () => ({ nowIso: () => opts.now }));
  }

  const analytics: AnalyticsModule = await import("../src/analytics");

  try {
    await cb(analytics, { readShop, getShopSettings, fetch }, dir);
  } finally {
    process.chdir(cwd);
    (global as any).fetch = originalFetch;
  }
}

/* -------------------------------------------------------------------------- */
/* Provider selection                                                         */
/* -------------------------------------------------------------------------- */

describe("analytics provider selection", () => {
  it("uses noop provider when analytics disabled", async () => {
    await withAnalytics(async (analytics, { readShop, getShopSettings, fetch }, dir) => {
      readShop.mockResolvedValue({ analyticsEnabled: false });

      const logSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
      await analytics.trackEvent("test", { type: "page_view" });

      expect(readShop).toHaveBeenCalledWith("test");
      expect(getShopSettings).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      await expect(
        fs.stat(path.join(dir, "data", "shops", "test", "analytics.jsonl"))
      ).rejects.toThrow();
      logSpy.mockRestore();
    });
  });

  it("skips tracking when disabled in settings", async () => {
    await withAnalytics(async (analytics, { readShop, getShopSettings, fetch }, _dir) => {
      readShop.mockResolvedValue({ analyticsEnabled: true });
      getShopSettings.mockResolvedValue({ analytics: { enabled: false } });

      const appendSpy = jest.spyOn(fs, "appendFile");
      const writeSpy = jest.spyOn(fs, "writeFile");
      const readSpy = jest.spyOn(fs, "readFile");
      const mkdirSpy = jest.spyOn(fs, "mkdir");

      await analytics.trackEvent("test", { type: "page_view" });

      expect(fetch).not.toHaveBeenCalled();
      expect(appendSpy).not.toHaveBeenCalled();
      expect(writeSpy).not.toHaveBeenCalled();
      expect(readSpy).not.toHaveBeenCalled();
      expect(mkdirSpy).not.toHaveBeenCalled();

      appendSpy.mockRestore();
      writeSpy.mockRestore();
      readSpy.mockRestore();
      mkdirSpy.mockRestore();
    });
  });

  it("uses console provider when configured", async () => {
    await withAnalytics(async (analytics, { readShop, getShopSettings, fetch }, dir) => {
      readShop.mockResolvedValue({ analyticsEnabled: true });
      getShopSettings.mockResolvedValue({ analytics: { provider: "console" } });

      const logSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
      await analytics.trackEvent("test", { type: "page_view" });

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
      await expect(
        fs.stat(path.join(dir, "data", "shops", "test", "analytics.jsonl"))
      ).rejects.toThrow();
      logSpy.mockRestore();
    });
  });

  it("uses Google Analytics provider when configured", async () => {
    await withAnalytics(async (analytics, { readShop, getShopSettings, fetch }, _dir) => {
      readShop.mockResolvedValue({ analyticsEnabled: true });
      getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "GA-1" } });
      process.env.GA_API_SECRET = "secret";

      await analytics.trackEvent("test", { type: "page_view" });

      expect(fetch).toHaveBeenCalledTimes(1);
      const url = fetch.mock.calls[0][0] as string;
      expect(url).toContain("measurement_id=GA-1");
      expect(url).toContain("api_secret=secret");

      delete process.env.GA_API_SECRET;
    });
  });

  it("falls back to file provider when GA config missing", async () => {
    await withAnalytics(async (analytics, { readShop, getShopSettings, fetch }, dir) => {
      readShop.mockResolvedValue({ analyticsEnabled: true });
      getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "GA-1" } });
      delete process.env.GA_API_SECRET;

      await analytics.trackEvent("test", { type: "page_view" });

      expect(fetch).not.toHaveBeenCalled();
      const fp = path.join(dir, "data", "shops", "test", "analytics.jsonl");
      const content = await fs.readFile(fp, "utf8");
      expect(content).toContain("\"type\":\"page_view\"");
    });
  });
});

/* -------------------------------------------------------------------------- */
/* Aggregates                                                                 */
/* -------------------------------------------------------------------------- */

describe("analytics aggregates", () => {
  it("updates counts for events", async () => {
    const now = "2023-01-01T00:00:00.000Z";
    await withAnalytics(
      async (analytics, { readShop, getShopSettings, fetch }, dir) => {
        readShop.mockResolvedValue({ analyticsEnabled: true });
        getShopSettings.mockResolvedValue({});

        await analytics.trackEvent("test", { type: "page_view" });
        await analytics.trackPageView("test", "/home");
        await analytics.trackEvent("test", { type: "order", orderId: "o1", amount: 2 });
        await analytics.trackOrder("test", "o2", 5);
        await analytics.trackEvent("test", { type: "discount_redeemed", code: "SAVE" });
        await analytics.trackEvent("test", { type: "ai_crawl" });

        const fp = path.join(
          dir,
          "data",
          "shops",
          "test",
          "analytics-aggregates.json"
        );
        const agg = JSON.parse(await fs.readFile(fp, "utf8"));
        expect(agg.page_view[now.slice(0, 10)]).toBe(2);
        expect(agg.order[now.slice(0, 10)]).toEqual({ count: 2, amount: 7 });
        expect(agg.discount_redeemed[now.slice(0, 10)].SAVE).toBe(1);
        expect(agg.ai_crawl[now.slice(0, 10)]).toBe(1);
        expect(fetch).not.toHaveBeenCalled();
      },
      { now }
    );
  });
});
