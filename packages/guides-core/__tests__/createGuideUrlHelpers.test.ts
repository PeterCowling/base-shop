import { createGuideUrlHelpers } from "../src";

type Lang = "en" | "it";
type GuideKey = "beachGuide" | "foodTour";

const slugsByKey = {
  beachGuide: {
    en: "best-beaches",
    it: "spiagge-migliori",
  },
  foodTour: {
    en: "food-tour",
  },
} as const satisfies Record<GuideKey, Partial<Record<Lang, string>>>;

const helpers = createGuideUrlHelpers<Lang, GuideKey>({
  baseUrl: "https://example.com/",
  keys: ["beachGuide", "foodTour"],
  languages: ["en", "it"],
  slugsByKey,
  defaultLang: "en",
  basePathForKey: (lang, key) => `/${lang}/${key === "beachGuide" ? "guides" : "experiences"}`,
  fallbackSlugFromKey: (key) => key.replace(/([a-z\d])([A-Z])/g, "$1-$2").toLowerCase(),
});

describe("createGuideUrlHelpers", () => {
  it("builds guide paths and absolute urls", () => {
    expect(helpers.guidePath("en", "beachGuide")).toBe("/en/guides/best-beaches");
    expect(helpers.guidePath("it", "foodTour")).toBe("/it/experiences/food-tour");
    expect(helpers.guideAbsoluteUrl("en", "foodTour")).toBe("https://example.com/en/experiences/food-tour");
  });

  it("resolves guide keys from slugs (case + hyphen tolerant)", () => {
    expect(helpers.resolveGuideKeyFromSlug("BEST-BEACHES", "en")).toBe("beachGuide");
    expect(helpers.resolveGuideKeyFromSlug("bestbeaches", "en")).toBe("beachGuide");
    expect(helpers.resolveGuideKeyFromSlug("foodtour")).toBe("foodTour");
  });
});
