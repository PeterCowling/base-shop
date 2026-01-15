import config from "../../../react-router.config";

import { describe, expect, it } from "vitest";

import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";
import { buildGuideStatusMap, listGuideManifestEntries } from "@/routes/guides/guide-manifest";
import { collectGuideAliasKeys, guideSlug, publishedGuideKeysByBase } from "@/guides/slugs";

describe("react-router.config prerender", () => {
  it("includes /guides index and alias pages for every locale", async () => {
    expect(typeof config.prerender).toBe("function");
    const paths = (await config.prerender?.()) ?? [];
    const pathSet = new Set(paths);
    const manifestEntries = listGuideManifestEntries();
    const statusMap = buildGuideStatusMap(manifestEntries);
    const isProd = process.env.NODE_ENV === "production";
    const groups = publishedGuideKeysByBase(isProd, statusMap, manifestEntries);
    const aliasKeys = collectGuideAliasKeys(groups);
    expect(aliasKeys.length).toBeGreaterThan(0);

    for (const lang of i18nConfig.supportedLngs as AppLanguage[]) {
      const guidesSlug = getSlug("guides", lang);
      const tagsSlug = getSlug("guidesTags", lang);
      expect(pathSet.has(`/${lang}/${guidesSlug}`)).toBe(true);
      expect(pathSet.has(`/${lang}/${guidesSlug}/${tagsSlug}`)).toBe(true);
      for (const key of aliasKeys) {
        const slug = guideSlug(lang, key);
        expect(pathSet.has(`/${lang}/${guidesSlug}/${slug}`)).toBe(true);
      }
    }
  });
});