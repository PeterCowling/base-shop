// apps/shop-bcd/__tests__/seo.test.ts
import { getSeo } from "../src/lib/seo";

const getShopSettingsMock = jest.fn();

jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: (...args: any[]) => getShopSettingsMock(...args),
}));

describe("getSeo", () => {
  beforeEach(() => {
    getShopSettingsMock.mockResolvedValue({
      seo: {
        en: { canonicalBase: "https://example.com", title: "Base EN", description: "Desc EN" },
        de: { canonicalBase: "https://beispiel.de", title: "Base DE", description: "Desc DE" },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("builds canonical urls from canonicalBase for locales", async () => {
    const seoEn = await getSeo("en");
    expect(seoEn.canonical).toBe("https://example.com/en");
    expect(seoEn.openGraph?.url).toBe("https://example.com/en");

    const seoDe = await getSeo("de");
    expect(seoDe.canonical).toBe("https://beispiel.de/de");
    expect(seoDe.openGraph?.url).toBe("https://beispiel.de/de");
  });

  it("overrides base seo with pageSeo values", async () => {
    const seo = await getSeo("en", {
      title: "Page Title",
      description: "Page Desc",
      canonical: "https://override.com/page",
      openGraph: {
        url: "https://override.com/page",
        title: "OG Title",
        description: "OG Desc",
        image: "https://img/og.png",
      } as any,
      twitter: {
        title: "TW Title",
        description: "TW Desc",
        image: "https://img/tw.png",
        card: "summary_large_image",
      } as any,
    });

    expect(seo.title).toBe("Page Title");
    expect(seo.description).toBe("Page Desc");
    expect(seo.canonical).toBe("https://override.com/page");
    expect(seo.openGraph?.url).toBe("https://override.com/page");
    expect((seo.openGraph as any).title).toBe("OG Title");
    expect((seo.openGraph as any).description).toBe("OG Desc");
    expect((seo.openGraph as any).image).toBe("https://img/og.png");
    expect((seo.twitter as any).title).toBe("TW Title");
    expect((seo.twitter as any).description).toBe("TW Desc");
    expect((seo.twitter as any).image).toBe("https://img/tw.png");
    expect((seo.twitter as any).card).toBe("summary_large_image");
  });

  it("falls back to defaults when settings are missing", async () => {
    const seo = await getSeo("it");
    expect(seo.title).toBe("");
    expect(seo.description).toBe("");
    expect(seo.canonical).toBe("");
    expect(seo.openGraph?.url).toBeUndefined();
  });
});
