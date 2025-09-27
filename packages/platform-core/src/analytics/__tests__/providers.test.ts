import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";

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

  test("analytics disabled returns early without provider or aggregates", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: false });
    const fetchMock = globalThis.fetch as jest.Mock;
    const { trackEvent } = await import("../index");
    await expect(
      trackEvent(shop, { type: "page_view", page: "home" })
    ).resolves.toBeUndefined();
    expect(getShopSettings).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    const file = path.join(tmp, shop, "analytics.jsonl");
    await expect(fs.readFile(file, "utf8")).rejects.toBeDefined();
    const aggFile = path.join(tmp, shop, "analytics-aggregates.json");
    await expect(fs.readFile(aggFile, "utf8")).rejects.toBeDefined();
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

  test("google analytics provider defaults client_id to 555 when clientId missing", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: "ga", id: "G-XYZ" },
    });
    process.env.GA_API_SECRET = "secret";
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis.fetch as any) = fetchMock;
    const { trackEvent } = await import("../index");
    await trackEvent(shop, { type: "page_view", page: "home" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.client_id).toBe("555");
  });

  test("google analytics provider ignores fetch rejections", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({
      analytics: { provider: "ga", id: "G-XYZ" },
    });
    process.env.GA_API_SECRET = "secret";
    const fetchMock = jest.fn().mockRejectedValue(new Error("network"));
    (globalThis.fetch as any) = fetchMock;
    const { trackEvent } = await import("../index");
    await expect(
      trackEvent(shop, { type: "page_view", page: "home" })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
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

  test("falls back to file provider when GA id missing", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "ga" } });
    process.env.GA_API_SECRET = "secret";
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
