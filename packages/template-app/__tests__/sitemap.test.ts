import type { MetadataRoute } from "next";

const getShopSettingsMock = jest.fn();
const readRepoMock = jest.fn();

jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  getShopSettings: getShopSettingsMock,
}));

jest.mock("@acme/platform-core/repositories/products.server", () => ({
  readRepo: readRepoMock,
}));

jest.mock("@acme/config/env/core", () => ({
  loadCoreEnv: jest.fn(() => ({
    NEXT_PUBLIC_BASE_URL: process.env
      .NEXT_PUBLIC_BASE_URL as string | undefined,
    NEXT_PUBLIC_SHOP_ID: process.env
      .NEXT_PUBLIC_SHOP_ID as string | undefined,
  })),
}));

const ORIGINAL_ENV = process.env;

describe("sitemap generation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  it("uses defaults when env vars, languages, and slug are missing", async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_SHOP_ID;

    getShopSettingsMock.mockResolvedValueOnce({});
    readRepoMock.mockResolvedValueOnce([
      { id: "p1", updated_at: "2024-01-01T00:00:00Z" },
    ]);

    const { default: sitemap } = await import("../src/app/sitemap");
    const entries = (await sitemap()) as MetadataRoute.Sitemap;

    expect(getShopSettingsMock).toHaveBeenCalledWith("shop");
    expect(readRepoMock).toHaveBeenCalledWith("shop");

    const home = entries.find((e) => e.url === "http://localhost:3000/en");
    expect(home?.alternates?.languages).toEqual({
      en: "http://localhost:3000/en",
    });

    const product = entries.find(
      (e) => e.url === "http://localhost:3000/en/product/p1"
    );
    expect(product?.alternates?.languages).toEqual({
      en: "http://localhost:3000/en/product/p1",
    });
  });

  it("builds URLs with hreflang alternates for multiple languages", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
    process.env.NEXT_PUBLIC_SHOP_ID = "shop1";

    getShopSettingsMock.mockResolvedValueOnce({ languages: ["en", "de"] });
    readRepoMock.mockResolvedValueOnce([
      { id: "p1", slug: "shoe", updated_at: "2024-01-01T00:00:00Z" },
    ]);

    const { default: sitemap } = await import("../src/app/sitemap");
    const entries = (await sitemap()) as MetadataRoute.Sitemap;

    expect(getShopSettingsMock).toHaveBeenCalledWith("shop1");
    expect(readRepoMock).toHaveBeenCalledWith("shop1");

    const home = entries.find((e) => e.url === "https://example.com/en");
    expect(home?.alternates?.languages).toEqual({
      en: "https://example.com/en",
      de: "https://example.com/de",
    });

    const product = entries.find(
      (e) => e.url === "https://example.com/en/product/shoe"
    );
    expect(product?.alternates?.languages).toEqual({
      en: "https://example.com/en/product/shoe",
      de: "https://example.com/de/product/shoe",
    });
  });
});

