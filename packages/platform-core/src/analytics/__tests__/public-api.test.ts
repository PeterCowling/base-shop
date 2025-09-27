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

  test("trackPageView delegates to trackEvent and persists", async () => {
    getShopSettings.mockResolvedValue({ analytics: undefined });
    const { trackPageView } = await import("../index");
    await trackPageView(shop, "home");
    const content = await fs.readFile(
      path.join(tmp, shop, "analytics.jsonl"),
      "utf8"
    );
    const events = content
      .trim()
      .split(/\n+/)
      .map((l) => JSON.parse(l));
    expect(events).toEqual([
      {
        timestamp: "2024-01-01T00:00:00.000Z",
        type: "page_view",
        page: "home",
      },
    ]);
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

  test("rejects invalid shop name and validates", async () => {
    const shops = await import("../../shops");
    const validateSpy = jest.spyOn(shops, "validateShopName");
    const { trackEvent } = await import("../index");
    await expect(
      trackEvent("bad/shop", { type: "page_view", page: "home" })
    ).rejects.toThrow(/Invalid shop name/);
    expect(validateSpy).toHaveBeenCalled();
    validateSpy.mockRestore();
  });
});
