import { beforeEach, describe, expect, it } from "vitest";
import { withGuideMocks, type GuideTestContext } from "./__tests__/guideTestHarness";
import { GUIDE_KEY } from "./positano-parking";
import { getGuidesBundle } from "@/locales/guides";
import { within } from "@testing-library/react";
import { findJsonLdByType } from "@tests/jsonld";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const EN_GUIDES_BUNDLE = (getGuidesBundle("en") ?? {}) as Record<string, unknown>;

function seedGuide(
  setTranslations: GuideTestContext["setTranslations"],
  lang: string,
  overrides?: Record<string, unknown>,
) {
  setTranslations(lang, "guides", clone(EN_GUIDES_BUNDLE));
  if (overrides) {
    setTranslations(lang, "guides", overrides);
  }
}

describe("Positano parking guide (harness)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("renders primary sections and FAQ TOC entries in English", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ setTranslations, renderRoute, screen }) => {
      seedGuide(setTranslations, "en");

      await renderRoute({ lang: "en" });

      const toc = screen.getByRole("navigation", { name: /on this page/i });
      const labels = within(toc)
        .getAllByRole("link")
        .map((link) => link.textContent?.trim());
      expect(labels).toEqual(
        expect.arrayContaining([
          "Private garages in town",
          "Drop-off and payment routine",
          "Cheaper parking outside Positano",
          "FAQs",
        ]),
      );
    });
  });

  it("falls back to English breadcrumb labels when localized strings are blank", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ setTranslations, renderRoute }) => {
      seedGuide(setTranslations, "en");
      seedGuide(setTranslations, "it", {
        "labels.homeBreadcrumb": " ",
        "labels.guidesBreadcrumb": "",
      });

      await renderRoute({ lang: "it" });

      const breadcrumb = findJsonLdByType("BreadcrumbList") as
        | { itemListElement?: { name?: string }[] }
        | undefined;
      const [home, guides] = breadcrumb?.itemListElement ?? [];
      expect(home?.name).toBe("Home");
      expect(guides?.name).toBe("Guides");
    });
  });

  it("falls back to English structured copy when a locale lacks parking content", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ setTranslations, renderRoute, screen }) => {
      seedGuide(setTranslations, "en");
      seedGuide(setTranslations, "de", {
        "content.parking.sections": [],
        "content.parking.faqs": [],
      });

      await renderRoute({ lang: "de" });

      const toc = screen.getByTestId("toc");
      const labels = within(toc)
        .getAllByRole("link")
        .map((link) => link.textContent?.trim());
      expect(labels).toContain("Private garages in town");
    });
  });

  it("falls back to key defaults when metadata translations are missing", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ setTranslations, renderRoute, screen }) => {
      seedGuide(setTranslations, "en", {
        "content.parking.tocTitle": "content.parking.tocTitle",
        "content.parking.faqsTitle": "",
        "content.parking.intro": [],
        "content.parking.sections": [],
        "content.parking.faqs": [],
        "content.parking.seo": {
          title: "content.parking.seo.title",
          description: "content.parking.seo.description",
        },
        "meta.parking.title": "content.parking.seo.title",
        "meta.parking.description": " ",
      });

      await renderRoute({ lang: "en" });

      const breadcrumb = findJsonLdByType("BreadcrumbList") as
        | { itemListElement?: { name?: string }[] }
        | undefined;
      const [home] = breadcrumb?.itemListElement ?? [];
      expect(home?.name).toBe("Home");
      expect(screen.getByTestId("toc")).toBeInTheDocument();
    });
  });
});