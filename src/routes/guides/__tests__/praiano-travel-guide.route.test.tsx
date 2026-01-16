import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

const BREADCRUMB_ID = "breadcrumb-structured";

function readBreadcrumbNames(screen: typeof import("@testing-library/dom").screen) {
  const raw = screen.getByTestId(BREADCRUMB_ID).textContent ?? "{}";
  const breadcrumb = JSON.parse(raw) as {
    itemListElement?: Array<{ name?: string }>;
  };
  return (breadcrumb.itemListElement ?? []).map((item) => item?.name?.trim() ?? "");
}

describe("praiano travel guide route", () => {
  it("renders localized content when guides namespace is populated", async () => {
    await withGuideMocks("praianoGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.praianoGuide.title": "Praiano guide",
        "guides.meta.praianoGuide.description": "Discover hidden spots.",
        "content.praianoGuide.seo.title": "Praiano guide",
        "content.praianoGuide.seo.description": "Discover hidden spots.",
        "content.praianoGuide.intro": ["English intro"],
        "content.praianoGuide.sections": [{ id: "overview", title: "Overview", body: ["English body"] }],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      setTranslations("it", "guides", {
        "guides.meta.praianoGuide.title": "Guida di Praiano",
        "guides.meta.praianoGuide.description": "Scopri gli angoli nascosti di Praiano.",
        "content.praianoGuide.seo.title": "Guida di Praiano",
        "content.praianoGuide.seo.description": "Scopri gli angoli nascosti di Praiano.",
        "content.praianoGuide.intro": ["Passeggia al tramonto lungo la scogliera."],
        "content.praianoGuide.sections": [
          { id: "tramonti", title: "Tramonti", body: ["Raggiungi la chiesa al crepuscolo."] },
        ],
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
        "breadcrumbs.home": "Casa",
        "breadcrumbs.guides": "Guide",
      });

      await renderRoute({ lang: "it" });

      const heading = await screen.findByRole("heading", { level: 1 });
      expect(heading.textContent ?? "").toContain("Guida di Praiano");

      const names = readBreadcrumbNames(screen);
      expect(names).toContain("Casa");
      expect(names).toContain("Guide");
    });
  });

  it("falls back to English structured content when localised bundles are empty", async () => {
    await withGuideMocks("praianoGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.praianoGuide.title": "Praiano guide",
        "guides.meta.praianoGuide.description": "Discover hidden spots.",
        "content.praianoGuide.seo.title": "Praiano guide",
        "content.praianoGuide.seo.description": "Discover hidden spots.",
        "content.praianoGuide.intro": ["English intro"],
        "content.praianoGuide.sections": [{ id: "plan", title: "Plan ahead", body: ["Reserve the boat early."] }],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      setTranslations("es", "guides", {
        "guides.meta.praianoGuide.title": "Guía de Praiano",
        "guides.meta.praianoGuide.description": "Descubre rincones escondidos.",
        "content.praianoGuide.seo.title": "Guía de Praiano",
        "content.praianoGuide.seo.description": "Descubre rincones escondidos.",
        "content.praianoGuide.intro": [],
        "content.praianoGuide.sections": [],
        "labels.homeBreadcrumb": " ",
        "labels.guidesBreadcrumb": "",
        "breadcrumbs.home": " ",
        "breadcrumbs.guides": "",
      });

      await renderRoute({ lang: "es" });

      const names = readBreadcrumbNames(screen);
      expect(names).toContain("Home");
      expect(names).toContain("Guides");
      expect(screen.getByTestId("generic-praianoGuide")).toBeInTheDocument();
    });
  });

  it("renders locale strings even when English fallbacks are unavailable", async () => {
    await withGuideMocks("praianoGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.praianoGuide.title": "Praiano guide",
        "guides.meta.praianoGuide.description": "Discover hidden spots.",
        "content.praianoGuide.seo.title": "Praiano guide",
        "content.praianoGuide.seo.description": "Discover hidden spots.",
        "content.praianoGuide.intro": [],
        "content.praianoGuide.sections": [],
      });

      setTranslations("fr", "guides", {
        "guides.meta.praianoGuide.title": "Guide de Praiano",
        "guides.meta.praianoGuide.description": "Repérez les points clés pour une première visite.",
        "content.praianoGuide.seo.title": "Guide de Praiano",
        "content.praianoGuide.seo.description": "Repérez les points clés pour une première visite.",
        "content.praianoGuide.intro": ["Profitez des couchers de soleil en terrasse."],
        "content.praianoGuide.sections": [
          { id: "soleil", title: "Coucher de soleil", body: ["Arrivez une heure avant."] },
        ],
        "labels.homeBreadcrumb": "Accueil",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Accueil",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({ lang: "fr" });

      const heading = await screen.findByRole("heading", { level: 1 });
      expect(heading.textContent ?? "").toContain("Guide de Praiano");
    });
  });
});