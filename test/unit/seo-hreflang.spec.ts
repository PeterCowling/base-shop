const getShopSettingsMock = jest.fn();

jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: (...args: any[]) => getShopSettingsMock(...args),
}));

import { getSeo } from "../../packages/template-app/src/lib/seo";

describe("getSeo hreflang links", () => {
  beforeEach(() => {
    getShopSettingsMock.mockReset();
  });

  it("returns canonical and alternate links for all locales", async () => {
    getShopSettingsMock.mockResolvedValue({
      languages: ["en", "de", "it"],
      seo: {
        en: { canonicalBase: "https://example.com" },
        de: { canonicalBase: "https://example.de" },
        it: { canonicalBase: "https://example.it" },
      },
    });

    const seo = await getSeo("de");
    expect(seo.canonical).toBe("https://example.de/de");
    expect(seo.alternates).toEqual([
      { hrefLang: "en", href: "https://example.com/en" },
      { hrefLang: "de", href: "https://example.de/de" },
      { hrefLang: "it", href: "https://example.it/it" },
    ]);
  });

  it("omits locales without canonical base", async () => {
    getShopSettingsMock.mockResolvedValue({
      languages: ["en", "de"],
      seo: {
        en: { canonicalBase: "https://example.com" },
      },
    });

    const seo = await getSeo("en");
    expect(seo.canonical).toBe("https://example.com/en");
    expect(seo.alternates).toEqual([
      { hrefLang: "en", href: "https://example.com/en" },
    ]);
  });
});
