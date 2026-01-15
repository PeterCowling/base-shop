import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { capturedFaqFallbacks, genericContentMock } from "./guides.test-utils";

describe("inside a limoncello factory guide", () => {
  it("prefers localized structured content when available", async () => {
    await withGuideMocks(
      "limoncelloFactory",
      async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.limoncelloFactory.title": "Inside a limoncello factory",
        "guides.meta.limoncelloFactory.description": "Discover the craft limoncello process.",
        "content.limoncelloFactory.fallbackParagraph": "English fallback paragraph",
        "content.limoncelloFactory.intro": ["English intro"],
        "content.limoncelloFactory.faqs": [{ q: "What is limoncello?", a: ["A lemon liqueur."] }],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      setTranslations("it", "guides", {
        "guides.meta.limoncelloFactory.title": "Visita la fabbrica di limoncello",
        "guides.meta.limoncelloFactory.description": "Scopri come nasce un buon limoncello",
        "content.limoncelloFactory.seo.title": "Visita la fabbrica di limoncello",
        "content.limoncelloFactory.seo.description": "Scopri come nasce un buon limoncello",
        "content.limoncelloFactory.intro": ["Benvenutə alla nostra cooperativa di limoncello"],
        "content.limoncelloFactory.sections": [
          { title: "Il processo", body: ["Dalla scorza alla bottiglia"] },
        ],
        "content.limoncelloFactory.faqs": [
          { q: "Quanto dura la visita?", a: ["Circa 45 minuti."] },
        ],
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
        "breadcrumbs.home": "Casa",
        "breadcrumbs.guides": "Guide",
      });

      await renderRoute({
        lang: "it",
        route: "/it/guide/inside-a-limoncello-factory-amalfi-coast",
      });

      const heading = await screen.findByRole("heading", { level: 1 });
      expect(heading.textContent?.length ?? 0).toBeGreaterThan(0);
      expect(screen.queryByText("English fallback paragraph")).toBeNull();
      },
      { harness: { genericContent: "force" } },
    );
  });

  it("renders the fallback paragraph when structured content is missing", async () => {
    await withGuideMocks(
      "limoncelloFactory",
      async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.limoncelloFactory.title": "Inside a limoncello factory",
        "guides.meta.limoncelloFactory.description": "Discover the craft limoncello process.",
        "content.limoncelloFactory.intro": ["English intro"],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      setTranslations("es", "guides", {
        "guides.meta.limoncelloFactory.title": "Visita una fábrica de limoncello",
        "guides.meta.limoncelloFactory.description": "Aprende cómo se elabora el limoncello",
        "content.limoncelloFactory.seo.title": "Visita una fábrica de limoncello",
        "content.limoncelloFactory.seo.description": "Aprende cómo se elabora el limoncello",
        "content.limoncelloFactory.intro": [],
        "content.limoncelloFactory.sections": [],
        "content.limoncelloFactory.faqs": [],
        "content.limoncelloFactory.fallbackParagraph": "Si no hay visita guiada, disfruta de la degustación.",
        "labels.homeBreadcrumb": "Inicio",
        "labels.guidesBreadcrumb": "Guías",
        "breadcrumbs.home": "Inicio",
        "breadcrumbs.guides": "Guías",
      });

      await renderRoute({
        lang: "es",
        route: "/es/guides/inside-a-limoncello-factory-amalfi-coast",
      });

      await expect(
        screen.findByText("Si no hay visita guiada, disfruta de la degustación."),
      ).resolves.toBeInTheDocument();
      expect(genericContentMock).not.toHaveBeenCalled();
      },
      { harness: { genericContent: "force" } },
    );
  });

  it("emits localized breadcrumb structured data for Italian locales", async () => {
    await withGuideMocks("limoncelloFactory", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
      });

      setTranslations("it", "guides", {
        "content.limoncelloFactory.seo.title": "Fabbrica di limoncello da visitare",
        "content.limoncelloFactory.seo.description": "Itinerario aromatico tra limoneti e degustazioni",
        "content.limoncelloFactory.intro": ["Intro"],
        "content.limoncelloFactory.sections": [],
        "content.limoncelloFactory.faqs": [],
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
      });

      await renderRoute({
        lang: "it",
        route: "/it/guide/inside-a-limoncello-factory-amalfi-coast",
      });

      const breadcrumbRaw = screen.getByTestId("breadcrumb-structured").textContent ?? "";
      const breadcrumb = JSON.parse(breadcrumbRaw) as {
        itemListElement: Array<{ position: number; name: string; item: string }>;
      };

      expect(breadcrumb.itemListElement).toEqual([
        {
          "@type": "ListItem",
          position: 1,
          name: "Casa",
          item: "https://hostel-positano.com/it",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Guide",
          item: "https://hostel-positano.com/it/guide",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Fabbrica di limoncello da visitare",
          item: "https://hostel-positano.com/it/guide/inside-a-limoncello-factory-amalfi-coast",
        },
      ]);
    });
  });
});