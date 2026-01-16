import { beforeAll, describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { expectRouteHeadBasics } from "@tests/head";
import { findJsonLdByType } from "@tests/jsonld";
import { loadBaseBundles, type Bundle } from "./new-guides-coverage.shared";
import { withGuideMocks } from "./guideTestHarness";
import { GUIDE_KEY } from "../bus-back-from-laurito-beach";

let baseGuidesBundle: Bundle;
let baseHeaderBundle: Bundle;
let baseTranslationBundle: Bundle;

describe("Bus back from Laurito Beach — route coverage", () => {
  beforeAll(async () => {
    const base = await loadBaseBundles();
    baseGuidesBundle = base.baseGuidesBundle;
    baseHeaderBundle = base.baseHeaderBundle;
    baseTranslationBundle = base.baseTranslationBundle;
  });

  it("renders the Laurito Beach return guide and related helpers", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuidesBundle);
      setTranslations("en", "header", baseHeaderBundle);
      setTranslations("en", "translation", baseTranslationBundle);
      setCurrentLanguage("en");

      const view = await renderRoute({ lang: "en", route: "/en/guides/bus-back-from-laurito-beach" });

      await expect(
        view.findByRole("heading", { level: 1, name: /bus back to hostel brikette from laurito beach/i }),
      ).resolves.toBeInTheDocument();

      expectRouteHeadBasics({ expectArticle: true });

      const faq = findJsonLdByType("FAQPage");
      expect(faq).toBeTruthy();

      const relatedGuidesSection = view.container.querySelector("section");
      expect(relatedGuidesSection).toBeTruthy();
      if (relatedGuidesSection) {
        const { getAllByRole } = within(relatedGuidesSection);
        expect(getAllByRole("link").length).toBeGreaterThan(0);
      }
    });
  });
});