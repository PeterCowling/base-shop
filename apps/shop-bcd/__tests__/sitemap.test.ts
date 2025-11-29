import type { MetadataRoute } from "next";
import type { SanityConfig } from "@platform-core/repositories/blog.server";

const getShopSettingsMock = jest.fn();
const readRepoMock = jest.fn();
const listPostsMock = jest.fn();

jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: getShopSettingsMock,
}));

jest.mock("@platform-core/repositories/products.server", () => ({
  readRepo: readRepoMock,
}));

jest.mock("@platform-core/repositories/blog.server", () => ({
  listPosts: (config: SanityConfig) => listPostsMock(config),
}));

jest.mock("@acme/sanity", () => ({
  getConfig: jest.fn(async () => ({ projectId: "p", dataset: "d", token: "t" })),
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

  it("builds URLs with hreflang alternates and blog entries", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
    process.env.NEXT_PUBLIC_SHOP_ID = "bcd";

    getShopSettingsMock.mockResolvedValueOnce({
      languages: ["en", "de"],
      luxuryFeatures: { blog: true },
    });
    readRepoMock.mockResolvedValueOnce([
      { id: "p1", slug: "shoe", updated_at: "2024-01-01T00:00:00Z" },
    ]);
    listPostsMock.mockResolvedValueOnce([
      { _id: "1", slug: "hello", publishedAt: "2024-02-01T00:00:00Z" },
    ]);

    const { default: sitemap } = await import("../src/app/sitemap");
    const entries = (await sitemap()) as MetadataRoute.Sitemap;

    expect(getShopSettingsMock).toHaveBeenCalledWith("bcd");
    expect(readRepoMock).toHaveBeenCalledWith("bcd");
    expect(listPostsMock).toHaveBeenCalled();

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

    const blog = entries.find((e) => e.url === "https://example.com/en/blog");
    expect(blog?.alternates?.languages).toEqual({
      en: "https://example.com/en/blog",
      de: "https://example.com/de/blog",
    });

    const post = entries.find(
      (e) => e.url === "https://example.com/en/blog/hello"
    );
    expect(post?.alternates?.languages).toEqual({
      en: "https://example.com/en/blog/hello",
      de: "https://example.com/de/blog/hello",
    });
  });
});
