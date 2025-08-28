import { jest } from "@jest/globals";

const getShopSettingsMock = jest.fn();

jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: getShopSettingsMock,
}));

describe("getSeo", () => {
  const settings = {
    languages: ["en", "de"],
    seo: {
      en: {
        canonicalBase: "https://shop.com",
        openGraph: { image: "/default.jpg" },
      },
      de: {
        canonicalBase: "https://shop.de",
        openGraph: { image: "/default-de.jpg" },
      },
    },
  };

  beforeEach(() => {
    getShopSettingsMock.mockResolvedValue(settings);
  });

  afterEach(() => {
    jest.resetModules();
    getShopSettingsMock.mockClear();
  });

  it("computes canonical URL from page data and resolves relative images", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", {
      canonical: "https://shop.com/en/about",
      openGraph: { images: [{ url: "/og.png" }] },
    });
    expect(seo.canonical).toBe("https://shop.com/en/about");
    expect(seo.openGraph?.images?.[0]?.url).toBe("https://shop.com/og.png");
    expect(seo.additionalLinkTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hrefLang: "en", href: "https://shop.com/en/about" }),
        expect.objectContaining({ hrefLang: "de", href: "https://shop.de/de/about" }),
      ]),
    );
  });

  it("falls back to canonicalBase when page canonical missing", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en");
    expect(seo.canonical).toBe("https://shop.com/en");
    expect(seo.additionalLinkTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hrefLang: "en", href: "https://shop.com/en" }),
        expect.objectContaining({ hrefLang: "de", href: "https://shop.de/de" }),
      ]),
    );
  });

  it("handles invalid canonical URL gracefully", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", { canonical: "not a url" });
    expect(seo.canonical).toBe("not a url");
    expect(seo.openGraph?.url).toBe("https://shop.com/en");
    expect(seo.additionalLinkTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hrefLang: "en", href: "https://shop.com/en" }),
        expect.objectContaining({ hrefLang: "de", href: "https://shop.de/de" }),
      ]),
    );
  });
});

