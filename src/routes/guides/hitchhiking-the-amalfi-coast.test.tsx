import { beforeEach, describe, expect, it } from "vitest";

import { withGuideMocks } from "./__tests__/guideTestHarness";
import {
  genericContentMock,
  breadcrumbStructuredDataMock,
} from "./__tests__/guides.test-utils";
import { GUIDE_KEY } from "./hitchhiking-the-amalfi-coast";

const getTranslator = () => {
  const call = genericContentMock.mock.calls.at(-1)?.[0];
  return call ? { translator: call.t, guideKey: call.guideKey } : { translator: undefined, guideKey: undefined };
};

const getBreadcrumb = () => {
  return breadcrumbStructuredDataMock.mock.calls.at(-1)?.[0]?.breadcrumb;
};

describe("hitchhiking-the-amalfi-coast route – translator fallbacks", () => {
  beforeEach(() => {
    genericContentMock.mockClear();
    breadcrumbStructuredDataMock.mockClear();
  });

  it("falls back to English content when localized arrays are empty", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setCurrentLanguage("it");

      setTranslations("it", "guides", {
        "labels.homeBreadcrumb": "",
        "labels.guidesBreadcrumb": "labels.guidesBreadcrumb",
        "content.hitchhikingAmalfi.intro": [],
        "content.hitchhikingAmalfi.sections": [],
        "content.hitchhikingAmalfi.faqs": [],
        "content.hitchhikingAmalfi.seo.title": "Localized title",
        "content.hitchhikingAmalfi.seo.description": "Localized description",
      });

      setTranslations("en", "guides", {
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "content.hitchhikingAmalfi.intro": ["English intro"],
        "content.hitchhikingAmalfi.sections": [{ id: "prep", title: "Prep", body: ["Checklist"] }],
        "content.hitchhikingAmalfi.faqs": [{ q: "Is it safe?", a: ["Be cautious"] }],
      });

      await renderRoute({ lang: "it" });

      const { translator, guideKey } = getTranslator();
      expect(guideKey).toBe(GUIDE_KEY);
      expect(typeof translator).toBe("function");
      if (typeof translator === "function") {
        expect(
          translator(`content.${GUIDE_KEY}.intro`, {
            returnObjects: true,
            defaultValue: [] as string[],
          }),
        ).toEqual(["English intro"]);
      }

      const breadcrumb = getBreadcrumb();
      expect(breadcrumb?.itemListElement?.[0]?.name).toBe("Home");
      expect(breadcrumb?.itemListElement?.[1]?.name).toBe("Guides");
    });
  });

  it("prefers localized translators and breadcrumbs when structured content exists", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setCurrentLanguage("fr");

      setTranslations("fr", "guides", {
        "labels.homeBreadcrumb": "Accueil",
        "labels.guidesBreadcrumb": "Guides FR",
        "content.hitchhikingAmalfi.intro": ["Intro FR"],
        "content.hitchhikingAmalfi.sections": [{ id: "section", title: "Section FR", body: ["Paragraphe"] }],
        "content.hitchhikingAmalfi.faqs": [{ q: "FAQ FR?", a: ["Réponse"] }],
        "content.hitchhikingAmalfi.seo.title": "Titre FR",
        "content.hitchhikingAmalfi.seo.description": "Description FR",
      });

      await renderRoute({ lang: "fr" });

      const { translator } = getTranslator();
      expect(typeof translator).toBe("function");
      if (typeof translator === "function") {
        expect(
          translator(`content.${GUIDE_KEY}.intro`, {
            returnObjects: true,
            defaultValue: [] as string[],
          }),
        ).toEqual(["Intro FR"]);
      }

      const breadcrumb = getBreadcrumb();
      expect(breadcrumb?.itemListElement?.[0]?.name).toBe("Accueil");
      expect(breadcrumb?.itemListElement?.[1]?.name).toBe("Guides FR");
    });
  });
});