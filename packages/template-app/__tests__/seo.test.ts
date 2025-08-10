import { getSeo } from "../src/lib/seo";

const getShopSettingsMock = jest.fn();

jest.mock("@platform-core/repositories/shops.server", () => ({
  getShopSettings: (...args: any[]) => getShopSettingsMock(...args),
}));

describe("getSeo alternates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates canonical and hreflang links for all locales", async () => {
    getShopSettingsMock.mockResolvedValue({
      languages: ["en", "de", "it"],
      seo: {
        en: { canonicalBase: "https://example.com" },
        de: { canonicalBase: "https://beispiel.de" },
        it: { canonicalBase: "https://esempio.it" },
      },
    });

    const seo = await getSeo("de");
    expect(seo.canonical).toBe("https://beispiel.de/de");
    expect(seo.alternate).toEqual(
      expect.arrayContaining([
        { hrefLang: "en", href: "https://example.com/en" },
        { hrefLang: "de", href: "https://beispiel.de/de" },
        { hrefLang: "it", href: "https://esempio.it/it" },
      ]),
    );
  });

  it("handles missing canonical bases", async () => {
    getShopSettingsMock.mockResolvedValue({ languages: ["en"], seo: {} });

    const seo = await getSeo("en");
    expect(seo.canonical).toBe("");
    expect(seo.alternate).toEqual([]);
  });
});
