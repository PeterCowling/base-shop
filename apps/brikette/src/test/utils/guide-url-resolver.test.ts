import { type AppLanguage } from "@/i18n.config";
import {
  guideAbsoluteUrl,
  guideHref,
  guidePath,
  guideSlug,
  resolveGuideKeyFromSlug,
} from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

describe("guide URL resolver", () => {
  const lang = "en" as AppLanguage;
  const legacyBase = `/${lang}/${getSlug("guides", lang)}/`;

  const assertBase = (key: Parameters<typeof guideHref>[1], baseKey: Parameters<typeof getSlug>[0]) => {
    const base = `/${lang}/${getSlug(baseKey, lang)}/`;
    const expected = `${base}${guideSlug(lang, key)}`;

    expect(guidePath(lang, key)).toBe(expected);
    expect(guideHref(lang, key)).toBe(expected);
    expect(guideHref(lang, key)).not.toContain(legacyBase);
    expect(guideAbsoluteUrl(lang, key)).toContain(expected);
  };

  it("routes experience guides under experiences", () => {
    assertBase("pathOfTheGods", "experiences");
  });

  it("routes reachBudget under the current manifest namespace", () => {
    assertBase("reachBudget", "experiences");
  });

  it("routes how-to-get-here guides under how-to-get-here", () => {
    assertBase("ferryDockToBrikette", "howToGetHere");
  });

  it("resolves compact legacy key slugs to guide keys", () => {
    expect(resolveGuideKeyFromSlug("positanomainbeach", "it")).toBe("positanoMainBeach");
    expect(resolveGuideKeyFromSlug("positanomainbeachwalkdown", "it")).toBe("positanoMainBeachWalkDown");
  });
});
