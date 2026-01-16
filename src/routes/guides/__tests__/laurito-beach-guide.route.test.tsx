import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import {
  capturedFaqFallbacks,
  useTranslationMock,
} from "./guides.test-utils";

describe("laurito beach guide route", () => {
  it("uses localized gallery metadata while falling back to English placeholders where needed", async () => {
    await withGuideMocks("lauritoBeachGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.lauritoBeachGuide.title": "Laurito Beach guide",
        "guides.meta.lauritoBeachGuide.description": "How to enjoy Laurito Beach in Positano.",
        "content.lauritoBeachGuide.seo.title": "Laurito Beach guide",
        "content.lauritoBeachGuide.seo.description": "How to enjoy Laurito Beach in Positano.",
        "content.lauritoBeachGuide.intro": ["English intro"],
        "content.lauritoBeachGuide.sections": [
          { title: "English overview", body: ["Take the steps down"] },
        ],
        "content.lauritoBeachGuide.faqs": [
          { q: "Is there food?", a: ["Reserve Da Adolfo."] },
        ],
        "content.lauritoBeachGuide.gallery.alt": "Laurito Beach shoreline",
        "labels.homeBreadcrumb": "Home EN",
        "labels.guidesBreadcrumb": "Guides EN",
        "breadcrumbs.home": "Home EN",
        "breadcrumbs.guides": "Guides EN",
      });

      setTranslations("it", "guides", {
        "guides.meta.lauritoBeachGuide.title": "Spiaggia di Laurito",
        "guides.meta.lauritoBeachGuide.description": "Consigli per visitare Laurito da Positano",
        "content.lauritoBeachGuide.seo.title": "Spiaggia di Laurito",
        "content.lauritoBeachGuide.seo.description": "Consigli per visitare Laurito da Positano",
        "content.lauritoBeachGuide.intro": ["Raggiungi Laurito con il traghetto locale"],
        "content.lauritoBeachGuide.sections": [
          {
            title: "Traghetto e prenotazioni",
            body: ["Arriva 30 minuti prima e prenota il tuo posto."],
          },
        ],
        "content.lauritoBeachGuide.faqs": [
          { q: "Servono contanti?", a: ["Sì, porta monete per il tragitto."] },
          { q: "", a: ["Ignora"] },
        ],
        "content.lauritoBeachGuide.gallery.alt": "   ",
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
        "breadcrumbs.home": "Casa",
        "breadcrumbs.guides": "Guide",
        "labels.onThisPage": "Su questa pagina",
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/laurito-beach-guide",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /spiaggia di laurito/i }),
      ).resolves.toBeInTheDocument();

      expect(screen.getByTestId("generic-lauritoBeachGuide")).toBeInTheDocument();

      const gallery = screen.getByTestId("image-gallery");
      const images = Array.from(gallery.querySelectorAll("img"));
      expect(images).not.toHaveLength(0);
      for (const img of images) {
        expect(img.getAttribute("alt")).toBe("Laurito Beach shoreline");
      }

      const faqFallback = capturedFaqFallbacks.get("lauritoBeachGuide");
      expect(faqFallback?.("it")).toEqual([
        { q: "Servono contanti?", a: ["Sì, porta monete per il tragitto."] },
      ]);
    });
  });

  it("falls back to English structured content when locale bundles are empty", async () => {
    await withGuideMocks("lauritoBeachGuide", async ({ setTranslations, renderRoute, screen }) => {
      useTranslationMock.mockClear();

      setTranslations("en", "guides", {
        "guides.meta.lauritoBeachGuide.title": "Laurito Beach guide",
        "guides.meta.lauritoBeachGuide.description": "How to enjoy Laurito Beach in Positano.",
        "content.lauritoBeachGuide.seo.title": "Laurito Beach guide",
        "content.lauritoBeachGuide.seo.description": "How to enjoy Laurito Beach in Positano.",
        "content.lauritoBeachGuide.intro": ["English intro"],
        "content.lauritoBeachGuide.sections": [
          { title: "English overview", body: ["Take the steps down"] },
        ],
        "content.lauritoBeachGuide.faqs": [
          { q: "Is there food?", a: ["Reserve Da Adolfo."] },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      setTranslations("es", "guides", {
        "guides.meta.lauritoBeachGuide.title": "Guía de Laurito",
        "guides.meta.lauritoBeachGuide.description": "Consejos para visitar la playa.",
        "content.lauritoBeachGuide.seo.title": "Guía de Laurito",
        "content.lauritoBeachGuide.seo.description": "Consejos para visitar la playa.",
        "content.lauritoBeachGuide.intro": [],
        "content.lauritoBeachGuide.sections": [],
        "content.lauritoBeachGuide.faqs": [],
        "labels.homeBreadcrumb": "Inicio",
        "labels.guidesBreadcrumb": "Guías",
        "breadcrumbs.home": "Inicio",
        "breadcrumbs.guides": "Guías",
        "labels.onThisPage": "Secciones",
      });

      await renderRoute({
        lang: "es",
        route: "/es/guides/laurito-beach-guide",
        harness: { syntheticToc: "off" },
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /guía de laurito/i }),
      ).resolves.toBeInTheDocument();

      expect(screen.getByTestId("toc").querySelectorAll("li")).toHaveLength(0);

      const faqFallback = capturedFaqFallbacks.get("lauritoBeachGuide");
      expect(faqFallback?.("es")).toEqual([
        { q: "Is there food?", a: ["Reserve Da Adolfo."] },
      ]);
    });
  });

  it("renders successfully across multiple locales", async () => {
    await withGuideMocks("lauritoBeachGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.lauritoBeachGuide.title": "Laurito Beach guide",
        "guides.meta.lauritoBeachGuide.description": "How to enjoy Laurito Beach in Positano.",
        "content.lauritoBeachGuide.seo.title": "Laurito Beach guide",
        "content.lauritoBeachGuide.seo.description": "How to enjoy Laurito Beach in Positano.",
        "content.lauritoBeachGuide.intro": ["English intro"],
        "content.lauritoBeachGuide.sections": [
          { title: "English overview", body: ["Take the steps down"] },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      const locales: Array<{ lang: "pt" | "fr"; title: string; heading: RegExp }> = [
        { lang: "pt", title: "Praia de Laurito", heading: /praia de laurito/i },
        { lang: "fr", title: "Plage de Laurito", heading: /plage de laurito/i },
      ];

      for (const { lang, title, heading } of locales) {
        setTranslations(lang, "guides", {
          [`guides.meta.lauritoBeachGuide.title`]: title,
          [`guides.meta.lauritoBeachGuide.description`]: "Description",
          [`content.lauritoBeachGuide.seo.title`]: title,
          [`content.lauritoBeachGuide.seo.description`]: "Description",
          [`content.lauritoBeachGuide.intro`]: ["Intro"],
          [`content.lauritoBeachGuide.sections`]: [
            { title: "Section", body: ["Body"] },
          ],
          [`labels.homeBreadcrumb`]: lang === "pt" ? "Início" : "Accueil",
          [`labels.guidesBreadcrumb`]: lang === "pt" ? "Guias" : "Guides",
          [`breadcrumbs.home`]: lang === "pt" ? "Início" : "Accueil",
          [`breadcrumbs.guides`]: lang === "pt" ? "Guias" : "Guides",
        });

        await renderRoute({
          lang,
          route: `/${lang}/guides/laurito-beach-guide`,
        });

        await expect(
          screen.findByRole("heading", { level: 1, name: heading }),
        ).resolves.toBeInTheDocument();
      }
    });
  });
});