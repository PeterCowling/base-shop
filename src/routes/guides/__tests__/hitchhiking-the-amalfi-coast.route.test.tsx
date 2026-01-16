import { beforeEach, describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import {
  genericContentMock,
  relatedGuidesMock,
  tableOfContentsMock,
  capturedFaqFallbacks,
  resetGuideTestState,
} from "./guides.test-utils";

const parseBreadcrumb = (payload?: string | null) => {
  if (!payload) return null;
  try {
    return JSON.parse(payload) as {
      itemListElement?: Array<{ name?: string }>;
    };
  } catch {
    return null;
  }
};

describe("hitchhiking-the-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTestState();
    genericContentMock.mockClear();
    relatedGuidesMock.mockClear();
    tableOfContentsMock.mockClear();
    capturedFaqFallbacks.clear();
  });

  it("renders localized guide content when data exists", async () => {
    await withGuideMocks("hitchhikingAmalfi", async ({ renderRoute, screen, setTranslations, setCurrentLanguage }) => {
      setTranslations("es", "guides", {
        "guides.meta.hitchhikingAmalfi.title": "Autostop en la Costa Amalfitana",
        "guides.meta.hitchhikingAmalfi.description": "Consejos para viajar a dedo.",
        "content.hitchhikingAmalfi.seo.title": "Autostop en la Costa Amalfitana",
        "content.hitchhikingAmalfi.seo.description": "Consejos para viajar a dedo.",
        "content.hitchhikingAmalfi.intro": ["Introducción"],
        "content.hitchhikingAmalfi.sections": [
          { id: "prep", title: "Preparación", body: ["Checklist"] },
        ],
        "content.hitchhikingAmalfi.faqs": [{ q: "¿Es seguro?", a: ["Sé precavido"] }],
        "labels.homeBreadcrumb": "Inicio",
        "labels.guidesBreadcrumb": "Guías",
      });

      setCurrentLanguage("es");
      await renderRoute({ lang: "es" });

      expect(
        await screen.findByRole("heading", { level: 1, name: "Autostop en la Costa Amalfitana" }),
      ).toBeInTheDocument();

      const relatedNode = screen.getByTestId("related-guides");
      expect(relatedNode.dataset.lang).toBe("es");
      const relatedItems = JSON.parse(relatedNode.dataset.items ?? "[]") as Array<{ key: string }>;
      expect(relatedItems).toEqual([
        { key: "transportBudget" },
        { key: "positanoAmalfi" },
        { key: "positanoTravelGuide" },
      ]);

      const breadcrumbJson = screen.getByTestId("breadcrumb-structured").getAttribute("data-breadcrumb");
      const breadcrumb = parseBreadcrumb(breadcrumbJson);
      expect(breadcrumb?.itemListElement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "Inicio" }),
          expect.objectContaining({ name: "Guías" }),
        ]),
      );
    });
  });

  it("falls back to English translator when localized arrays are empty", async () => {
    await withGuideMocks("hitchhikingAmalfi", async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("es", "guides", {
        "labels.homeBreadcrumb": "labels.homeBreadcrumb",
        "labels.guidesBreadcrumb": "labels.guidesBreadcrumb",
        "content.hitchhikingAmalfi.intro": [],
        "content.hitchhikingAmalfi.sections": [],
        "content.hitchhikingAmalfi.faqs": [],
      });

      setTranslations("en", "guides", {
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "content.hitchhikingAmalfi.intro": ["English intro"],
        "content.hitchhikingAmalfi.sections": [
          { id: "prep", title: "Prep", body: ["Checklist"] },
        ],
        "content.hitchhikingAmalfi.faqs": [{ q: "Is it safe?", a: ["Be cautious"] }],
      });

      setCurrentLanguage("es");
      await renderRoute({ lang: "es" });

      expect(
        await screen.findByRole("heading", { level: 1, name: "Hitchhiking the Amalfi Coast" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("article-structured")).toHaveTextContent("Hitchhiking the Amalfi Coast");

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