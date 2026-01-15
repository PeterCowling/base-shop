import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("luminaria-di-san-domenico-praiano route", () => {
  it("renders localized structured content when data is present", async () => {
    await withGuideMocks("luminariaPraiano", async ({ setTranslations, setCurrentLanguage, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "guides.meta.luminariaPraiano.title": "Luminaria di San Domenico",
        "guides.meta.luminariaPraiano.description": "Luminarie e processioni a Praiano.",
        "content.luminariaPraiano.seo.title": "Luminaria di San Domenico",
        "content.luminariaPraiano.seo.description": "Luminarie e processioni a Praiano.",
        "content.luminariaPraiano.intro": ["Intro paragraph"],
        "content.luminariaPraiano.sections": [
          { id: "history", title: "Storia", body: ["Tradizione secolare"] },
        ],
        "content.luminariaPraiano.faqs": [{ q: "Quando?", a: ["1-4 agosto"] }],
        "content.luminariaPraiano.event": {
          date: "1 Agosto 2025",
          location: "Praiano",
          tips: ["Arriva presto"],
        },
        "content.luminariaPraiano.gallery": {
          terraceAlt: "Terrazza illuminata",
          coastAlt: "Costiera al tramonto",
        },
        "structured.luminariaPraiano": {
          name: "Luminaria Praiano",
          startDate: "2025-08-01",
          endDate: "2025-08-03",
          locationName: "Convento di San Domenico",
          addressLocality: "Praiano",
          description: "Festa delle luminarie a Praiano.",
        },
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
        "components.eventInfo.title": "Info evento",
        "components.eventInfo.labels.when": "Quando",
        "components.eventInfo.labels.where": "Dove",
      });

      setTranslations("en", "guides", {
        "content.luminariaPraiano.event": {
          date: "Fallback date",
          location: "Fallback location",
          tips: ["Fallback tip"],
        },
        "content.luminariaPraiano.gallery": {
          terraceAlt: "Fallback terrace",
          coastAlt: "Fallback coast",
        },
        "structured.luminariaPraiano": {
          name: "Fallback name",
          startDate: "2025-09-01",
          locationName: "Fallback place",
          addressLocality: "Fallback locality",
          description: "Fallback description",
        },
        "components.eventInfo.title": "Event info",
        "components.eventInfo.labels.when": "When",
        "components.eventInfo.labels.where": "Where",
      });

      setCurrentLanguage("it");
      const { container } = await renderRoute({ lang: "it" });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Luminaria di San Domenico");
      expect(screen.getByTestId("article-structured")).toHaveAttribute(
        "data-description",
        "Luminarie e processioni a Praiano.",
      );

      expect(screen.getByText("1 Agosto 2025")).toBeInTheDocument();
      expect(screen.getByText("Praiano")).toBeInTheDocument();
      expect(screen.getByAltText("Terrazza illuminata")).toBeInTheDocument();
      expect(screen.getByAltText("Costiera al tramonto")).toBeInTheDocument();
      expect(screen.getByText("Arriva presto")).toBeInTheDocument();

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("Luminaria Praiano");
      expect(script?.textContent).toContain("2025-08-01");
    });
  });

  it("falls back to English content when localized data is empty", async () => {
    await withGuideMocks("luminariaPraiano", async ({ setTranslations, setCurrentLanguage, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.luminariaPraiano.title": "Luminaria di San Domenico",
        "guides.meta.luminariaPraiano.description": "Praiano’s celebrations and luminaries.",
        "content.luminariaPraiano.seo.title": "Luminaria di San Domenico",
        "content.luminariaPraiano.seo.description": "Praiano’s celebrations and luminaries.",
        "content.luminariaPraiano.intro": ["Celebrate with locals"],
        "content.luminariaPraiano.sections": [
          { id: "overview", title: "Overview", body: ["Lanterns line the cliffs"] },
        ],
        "content.luminariaPraiano.faqs": [{ q: "When is it?", a: ["Every August"] }],
        "content.luminariaPraiano.event": {
          date: "August 1",
          location: "Praiano",
          tips: ["Bring a tripod"],
        },
        "content.luminariaPraiano.gallery": {
          terraceAlt: "Praiano terrace",
          coastAlt: "Coastal horizon",
        },
        "structured.luminariaPraiano": {
          name: "Luminaria Praiano",
          startDate: "2025-08-01",
          locationName: "San Domenico",
          addressLocality: "Praiano",
          description: "Praiano’s signature luminary festival.",
        },
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "components.eventInfo.title": "Event info",
        "components.eventInfo.labels.when": "When",
        "components.eventInfo.labels.where": "Where",
      });

      setTranslations("sv", "guides", {
        "content.luminariaPraiano.intro": [],
        "content.luminariaPraiano.sections": [],
        "content.luminariaPraiano.faqs": [],
        "content.luminariaPraiano.event": {},
        "content.luminariaPraiano.gallery": {},
      });

      setCurrentLanguage("sv");
      const { container } = await renderRoute({ lang: "sv" });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(
        "Luminaria di San Domenico",
      );
      expect(screen.getByTestId("generic-luminariaPraiano")).toBeInTheDocument();

      // Fallback event info renders English strings
      expect(screen.getByText("August 1")).toBeInTheDocument();
      expect(screen.getByText("Praiano")).toBeInTheDocument();
      expect(screen.getByText("Bring a tripod")).toBeInTheDocument();

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script?.textContent).toContain("Praiano’s signature luminary festival.");
    });
  });
});