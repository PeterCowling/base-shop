import { renderToStaticMarkup } from "react-dom/server";

const getShopSettings = jest.fn();
const readShop = jest.fn();

jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: (...args: any[]) => getShopSettings(...args),
  readShop: (...args: any[]) => readShop(...args),
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: { NEXT_PUBLIC_SHOP_ID: "shop" },
}));

describe("AnalyticsScripts (extra cases)", () => {
  beforeEach(() => {
    jest.resetModules();
    getShopSettings.mockReset();
    readShop.mockReset();
  });

  it("returns null when analytics config is disabled", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { enabled: false } });
    const { default: AnalyticsScripts } = await import("../src/app/AnalyticsScripts");
    const element = await AnalyticsScripts();
    expect(element).toBeNull();
  });

  it("returns null when provider is unknown or missing id", async () => {
    // unknown provider
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "other" } });
    const { default: AnalyticsScripts } = await import("../src/app/AnalyticsScripts");
    const el1 = await AnalyticsScripts();
    expect(el1).toBeNull();

    // GA without id
    getShopSettings.mockResolvedValueOnce({ analytics: { provider: "ga" } });
    const { default: Analytics2 } = await import("../src/app/AnalyticsScripts");
    const el2 = await Analytics2();
    const html = renderToStaticMarkup(<>{el2}</>);
    expect(html).toBe("");
  });
});
