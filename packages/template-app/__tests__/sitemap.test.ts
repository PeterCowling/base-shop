import type { MetadataRoute } from "next";

const getShopSettingsMock = jest.fn().mockResolvedValue({ languages: ["en", "de"] });
const readRepoMock = jest.fn().mockResolvedValue([
  { id: "p1", slug: "shoe", updated_at: "2024-01-01T00:00:00Z" },
]);

jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: getShopSettingsMock,
}));

jest.mock("@platform-core/repositories/products.server", () => ({
  readRepo: readRepoMock,
}));

describe("sitemap generation", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
    process.env.NEXT_PUBLIC_SHOP_ID = "shop1";
  });

  it("builds URLs with hreflang alternates", async () => {
    const { default: sitemap } = await import("../src/app/sitemap");
    const entries = (await sitemap()) as MetadataRoute.Sitemap;
    expect(getShopSettingsMock).toHaveBeenCalledWith("shop1");
    expect(readRepoMock).toHaveBeenCalledWith("shop1");
    const home = entries.find((e) => e.url === "https://example.com/en");
    expect(home?.alternates?.languages?.de).toBe("https://example.com/de");
    const product = entries.find((e) => e.url.endsWith("/product/shoe"));
    expect(product?.alternates?.languages?.de).toBe(
      "https://example.com/de/product/shoe"
    );
  });
});

