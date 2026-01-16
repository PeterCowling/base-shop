import { beforeAll, describe, expect, it } from "vitest";
import { expectRouteHeadBasics } from "@tests/head";
import { findJsonLdByType } from "@tests/jsonld";
import { cloneBundle, loadBaseBundles, type Bundle } from "./new-guides-coverage.shared";
import { withGuideMocks } from "./guideTestHarness";
import { GUIDE_KEY } from "../budget-accommodation-beyond-positano";

let baseGuidesBundle: Bundle;
let baseHeaderBundle: Bundle;
let baseTranslationBundle: Bundle;

describe("Budget accommodation beyond Positano — route coverage", () => {
  beforeAll(async () => {
    const base = await loadBaseBundles();
    baseGuidesBundle = base.baseGuidesBundle;
    baseHeaderBundle = base.baseHeaderBundle;
    baseTranslationBundle = base.baseTranslationBundle;
  });

  it("renders article content, FAQ schema, and related guides in English", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuidesBundle);
      setTranslations("en", "header", baseHeaderBundle);
      setTranslations("en", "translation", baseTranslationBundle);
      setCurrentLanguage("en");

      const view = await renderRoute({
        lang: "en",
        route: "/en/guides/budget-accommodation-beyond-positano",
      });

      await expect(
        view.findByRole("heading", { level: 1, name: /budget accommodation beyond positano/i }),
      ).resolves.toBeInTheDocument();
      await expect(view.findByText(/Value-friendly bases outside Positano/i)).resolves.toBeInTheDocument();

      expectRouteHeadBasics({ expectArticle: true });
      const faqPayload = findJsonLdByType("FAQPage") as { mainEntity?: { name?: string }[] } | undefined;
      expect(faqPayload?.mainEntity?.[0]?.name).toMatch(/Is it worth commuting/i);
    });
  });

  it("falls back to English copy, header strings, and FAQ data when locale resources are blank", async () => {
    const germanGuides = cloneBundle(baseGuidesBundle);
    germanGuides.content.budgetAccommodationBeyond.intro = [];
    germanGuides.content.budgetAccommodationBeyond.sections = [];
    germanGuides.content.budgetAccommodationBeyond.faqs = [];
    germanGuides.breadcrumbs.home = " ";
    germanGuides.breadcrumbs.guides = " ";

    const germanHeader = cloneBundle(baseHeaderBundle);
    germanHeader.home = " ";
    germanHeader.guides = " ";

    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuidesBundle);
      setTranslations("en", "header", baseHeaderBundle);
      setTranslations("en", "translation", baseTranslationBundle);
      setTranslations("de", "guides", germanGuides);
      setTranslations("de", "header", germanHeader);
      setCurrentLanguage("de");

      const view = await renderRoute({
        lang: "de",
        route: "/de/guides/budget-accommodation-beyond-positano",
      });

      await expect(view.findByText(/Value-friendly bases outside Positano/i)).resolves.toBeInTheDocument();

      expectRouteHeadBasics({ expectArticle: true });
      const breadcrumb = findJsonLdByType("BreadcrumbList") as { itemListElement?: { name?: string }[] } | undefined;
      expect(breadcrumb?.itemListElement?.[0]?.name).toBe("Home");
      expect(breadcrumb?.itemListElement?.[1]?.name).toBe("Guides");

      const faqPayload2 = findJsonLdByType("FAQPage") as { mainEntity?: { name?: string }[] } | undefined;
      expect(
        faqPayload2?.mainEntity?.some((item) => /Is it worth commuting/i.test(item?.name ?? "")),
      ).toBe(true);
    });
  });
});