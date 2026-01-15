import { beforeEach, describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { resetGuideTestState, genericContentMock } from "./guides.test-utils";

const parseBreadcrumb = (payload?: string | null) => {
  if (!payload) return null;
  try {
    return JSON.parse(payload) as { itemListElement?: Array<{ name?: string }> };
  } catch {
    return null;
  }
};

describe("Italian phrases for travelers guide", () => {
  beforeEach(() => {
    resetGuideTestState();
    genericContentMock.mockClear();
  });

  it("uses localized structured content when available", async () => {
    await withGuideMocks("italianPhrasesCampania", async ({ renderRoute, screen, setTranslations, setCurrentLanguage }) => {
      setTranslations("it", "guides", {
        "guides.meta.italianPhrasesCampania.title": "Frasi utili",
        "guides.meta.italianPhrasesCampania.description": "Descrizione",
        "content.italianPhrasesCampania.seo.title": "Frasi utili",
        "content.italianPhrasesCampania.seo.description": "Descrizione",
        "content.italianPhrasesCampania.intro": ["Benvenuto!"],
        "content.italianPhrasesCampania.sections": [
          { id: "saluti", title: "Saluti", body: ["Ciao", "Buongiorno"] },
        ],
        "content.italianPhrasesCampania.faqs": [{ q: "Serve prenotare?", a: ["No"] }],
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
      });

      setCurrentLanguage("it");
      await renderRoute({ lang: "it" });

      expect(
        await screen.findByRole("heading", { level: 1, name: "Frasi utili" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("article-structured")).toHaveTextContent("Frasi utili");
      expect(screen.getByText("Benvenuto!")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Saluti" })).toBeInTheDocument();

      const breadcrumbJson = screen.getByTestId("breadcrumb-structured").getAttribute("data-breadcrumb");
      const breadcrumb = parseBreadcrumb(breadcrumbJson);
      expect(breadcrumb?.itemListElement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Casa" }),
          expect.objectContaining({ name: "Guide" }),
        ]),
      );
    });
  });

  it("falls back to English structured data when localized bundles are empty", async () => {
    await withGuideMocks("italianPhrasesCampania", async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("it", "guides", {
        "content.italianPhrasesCampania.intro": [],
        "content.italianPhrasesCampania.sections": [],
        "content.italianPhrasesCampania.faqs": [],
        "labels.homeBreadcrumb": "labels.homeBreadcrumb",
        "labels.guidesBreadcrumb": "labels.guidesBreadcrumb",
      });

      setTranslations("en", "guides", {
        "content.italianPhrasesCampania.intro": ["English intro"],
        "content.italianPhrasesCampania.sections": [
          { id: "phrases", title: "Phrases", body: ["Thank you"] },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
      });

      setCurrentLanguage("it");
      await renderRoute({ lang: "it" });

      const translator = genericContentMock.mock.calls.at(-1)?.[0]?.t as
        | ((key: string, options?: Record<string, unknown>) => unknown)
        | undefined;
      expect(translator?.("content.italianPhrasesCampania.intro", { returnObjects: true })).toEqual([
        "English intro",
      ]);

      const breadcrumbJson = document
        .querySelector('[data-testid="breadcrumb-structured"]')
        ?.getAttribute("data-breadcrumb");
      const breadcrumb = parseBreadcrumb(breadcrumbJson);
      expect(breadcrumb?.itemListElement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Home" }),
          expect.objectContaining({ name: "Guides" }),
        ]),
      );
    });
  });

  it("defaults breadcrumb labels when translations provide placeholders", async () => {
    await withGuideMocks("italianPhrasesCampania", async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("it", "guides", {
        "content.italianPhrasesCampania.intro": ["Intro"],
        "labels.homeBreadcrumb": "labels.homeBreadcrumb",
        "labels.guidesBreadcrumb": "labels.guidesBreadcrumb",
      });
      setTranslations("en", "guides", {});

      setCurrentLanguage("it");
      await renderRoute({ lang: "it" });

      const breadcrumbJson = document
        .querySelector('[data-testid="breadcrumb-structured"]')
        ?.getAttribute("data-breadcrumb");
      const breadcrumb = parseBreadcrumb(breadcrumbJson);
      expect(breadcrumb?.itemListElement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Home" }),
          expect.objectContaining({ name: "Guides" }),
        ]),
      );
    });
  });
});