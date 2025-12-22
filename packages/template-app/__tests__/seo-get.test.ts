import { jest } from "@jest/globals";

const getShopSettingsMock = jest.fn();

jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: getShopSettingsMock,
}));

jest.mock("@acme/config/env/core", () => ({ coreEnv: {} }));

import { LOCALES } from "@i18n/locales";

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
    expect(seo.canonical).toBe("https://shop.com/about");
    expect(seo.openGraph?.images?.[0]?.url).toBe("https://shop.com/og.png");
    const expected = [
      expect.objectContaining({ hrefLang: "en", href: "https://shop.com/about" }),
    ];
    if (LOCALES.includes("de" as any)) {
      expected.push(
        expect.objectContaining({ hrefLang: "de", href: "https://shop.de/about" }),
      );
    }
    expect(seo.additionalLinkTags).toEqual(expect.arrayContaining(expected));
  });

  it("falls back to canonicalBase when page canonical missing", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en");
    expect(seo.canonical).toBe("https://shop.com/en");
    const expected = [
      expect.objectContaining({ hrefLang: "en", href: "https://shop.com/en" }),
    ];
    if (LOCALES.includes("de" as any)) {
      expected.push(
        expect.objectContaining({ hrefLang: "de", href: "https://shop.de/de" }),
      );
    }
    expect(seo.additionalLinkTags).toEqual(expect.arrayContaining(expected));
  });

  it("handles invalid canonical URL gracefully", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", { canonical: "not a url" });
    expect(seo.canonical).toBe("https://shop.com/en");
    expect(seo.openGraph?.url).toBe("https://shop.com/en");
    const expected = [
      expect.objectContaining({ hrefLang: "en", href: "https://shop.com/en" }),
    ];
    if (LOCALES.includes("de" as any)) {
      expected.push(
        expect.objectContaining({ hrefLang: "de", href: "https://shop.de/de" }),
      );
    }
    expect(seo.additionalLinkTags).toEqual(expect.arrayContaining(expected));
  });

  it("returns relative canonical unchanged", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", { canonical: "/contact" });
    expect(seo.canonical).toBe("https://shop.com/contact");
    expect(seo.openGraph?.url).toBe("https://shop.com/contact");
    const expected = [
      expect.objectContaining({ hrefLang: "en", href: "https://shop.com/contact" }),
    ];
    if (LOCALES.includes("de" as any)) {
      expected.push(
        expect.objectContaining({ hrefLang: "de", href: "https://shop.de/contact" }),
      );
    }
    expect(seo.additionalLinkTags).toEqual(expect.arrayContaining(expected));
  });

  it.each([
    ["provided", "Page description", "Page description"],
    ["empty", "", ""],
  ])(
    "uses %s description without trimming",
    async (_label, input, expected) => {
      const { getSeo } = await import("../src/lib/seo");
      const seo = await getSeo("en", { description: input });
      expect(seo.description).toBe(expected);
    },
  );

  it("omits openGraph images when none provided", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      languages: ["en", "de"],
      seo: {
        en: { canonicalBase: "https://shop.com" },
        de: { canonicalBase: "https://shop.de" },
      },
    });
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en");
    expect(seo.openGraph?.images).toBeUndefined();
  });

  it("resolves openGraph image string to images array", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", { openGraph: { image: "/single.jpg" } });
    expect(seo.openGraph?.images).toEqual([
      { url: "https://shop.com/single.jpg" },
    ]);
  });

  it.each([
    [
      {
        title: "Custom",
        description: "Desc",
        canonical: "https://shop.com/en/page",
        openGraph: { image: "/og.jpg" },
      },
      {
        title: "Custom",
        description: "Desc",
        canonical: "https://shop.com/page",
        image: "https://shop.com/og.jpg",
      },
    ],
    [
      {
        title: "Another",
        description: "More",
        openGraph: { images: [{ url: "/img.png" }] },
      },
      {
        title: "Another",
        description: "More",
        canonical: "https://shop.com/en",
        image: "https://shop.com/img.png",
      },
    ],
  ])("generates meta tags for %o", async (input, expected) => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", input);
    expect(seo.title).toBe(expected.title);
    expect(seo.description).toBe(expected.description);
    expect(seo.canonical).toBe(expected.canonical);
    expect(seo.openGraph?.images?.[0]?.url).toBe(expected.image);
  });

  it("resolves openGraph images array", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", {
      openGraph: { images: [{ url: "/arr.jpg" }] },
    });
    expect(seo.openGraph?.images).toEqual([
      { url: "https://shop.com/arr.jpg" },
    ]);
  });

  it("passes through openGraph type and locales", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", {
      openGraph: {
        type: "article",
        locale: "fr_FR",
        alternateLocale: ["de_DE"],
      },
    });
    expect(seo.openGraph?.type).toBe("article");
    expect(seo.openGraph?.locale).toBe("fr_FR");
    expect(seo.openGraph?.alternateLocale).toEqual(["de_DE"]);
  });

  it.each([
    ["/page.jpg", "https://shop.com/page.jpg"],
    ["https://cdn.example.com/page.jpg", "https://cdn.example.com/page.jpg"],
  ])("uses pageSeo.image %s over defaults", async (image, expected) => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", { image });
    expect(seo.openGraph?.images?.[0]?.url).toBe(expected);
  });

  it.each([
    ["/og-image.jpg", "https://shop.com/og-image.jpg"],
    ["https://cdn.example.com/og-image.jpg", "https://cdn.example.com/og-image.jpg"],
  ])("uses pageSeo.openGraph.image %s over defaults", async (image, expected) => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", { openGraph: { image } });
    expect(seo.openGraph?.images?.[0]?.url).toBe(expected);
  });

  it("overrides base title, description and OG URL with pageSeo", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      languages: ["en", "de"],
      seo: {
        en: {
          canonicalBase: "https://shop.com",
          title: "Base title",
          description: "Base description",
          openGraph: {
            url: "https://shop.com/base-url",
            image: "/default.jpg",
          },
        },
        de: {
          canonicalBase: "https://shop.de",
          openGraph: { image: "/default-de.jpg" },
        },
      },
    });
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en", {
      title: "Page title",
      description: "Page description",
      openGraph: { url: "https://shop.com/page-url" },
    });
    expect(seo.title).toBe("Page title");
    expect(seo.description).toBe("Page description");
    expect(seo.openGraph?.url).toBe("https://shop.com/page-url");
  });

  it("uses base title, description and OG URL when pageSeo lacks them", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      languages: ["en", "de"],
      seo: {
        en: {
          canonicalBase: "https://shop.com",
          title: "Base title",
          description: "Base description",
          openGraph: {
            url: "https://shop.com/base-url",
            image: "/default.jpg",
          },
        },
        de: {
          canonicalBase: "https://shop.de",
          openGraph: { image: "/default-de.jpg" },
        },
      },
    });
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en");
    expect(seo.title).toBe("Base title");
    expect(seo.description).toBe("Base description");
    expect(seo.openGraph?.url).toBe("https://shop.com/base-url");
  });

  it("falls back to default title when none is provided", async () => {
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en");
    expect(seo.title).toBe("");
  });

  it("omits locales without canonicalBase from alternate links", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      languages: ["en", "de"],
      seo: {
        en: { canonicalBase: "https://shop.com", openGraph: { image: "/default.jpg" } },
        de: { openGraph: { image: "/default-de.jpg" } },
      },
    });
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en");
    expect(seo.additionalLinkTags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hrefLang: "en", href: "https://shop.com/en" }),
        expect.objectContaining({ hrefLang: "de", href: "https://shop.com/de" }),
      ]),
    );
  });

  it("falls back to empty canonical when canonicalBase missing", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      languages: ["en", "de"],
      seo: { en: {}, de: {} },
    });
    const { getSeo } = await import("../src/lib/seo");
    const seo = await getSeo("en");
    expect(seo.canonical).toBe("");
    expect(seo.openGraph?.url).toBe("");
    expect(seo.additionalLinkTags).toHaveLength(0);
  });
});
