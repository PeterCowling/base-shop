import { renderToStaticMarkup } from "react-dom/server";

const getShopSettings = jest.fn();
const readShop = jest.fn();

jest.mock("@acme/platform-core/repositories/shops.server", () => ({
  getShopSettings: (...args: any[]) => getShopSettings(...args),
  readShop: (...args: any[]) => readShop(...args),
}));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: { NEXT_PUBLIC_SHOP_ID: "shop" },
}));

describe("AnalyticsScripts", () => {
  beforeEach(() => {
    jest.resetModules();
    getShopSettings.mockReset();
    readShop.mockReset();
  });

  it("returns null when analytics disabled", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: false });
    getShopSettings.mockResolvedValue({});
    const { default: AnalyticsScripts } = await import("../src/app/AnalyticsScripts");
    const element = await AnalyticsScripts();
    expect(element).toBeNull();
  });

  it("renders GA scripts when enabled", async () => {
    readShop.mockResolvedValue({ analyticsEnabled: true });
    getShopSettings.mockResolvedValue({ analytics: { provider: "ga", id: "G-1" } });
    const { default: AnalyticsScripts } = await import(
      "../src/app/AnalyticsScripts"
    );
    const element = await AnalyticsScripts();
    const html = renderToStaticMarkup(<>{element}</>);
    expect(html).toContain(
      "https://www.googletagmanager.com/gtag/js?id=G-1"
    );
  });
});
