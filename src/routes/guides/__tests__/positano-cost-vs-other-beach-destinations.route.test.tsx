import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { setTranslations, capturedFaqFallbacks } from "./guides.test-utils";

describe("positano cost comparison route", () => {
  it("renders structured guide content when localization bundles are populated", async () => {
    await withGuideMocks("positanoCostComparison", async ({ renderRoute, screen, setTranslations }) => {
      setTranslations("en", "guides", {
        "guides.meta.positanoCostComparison.title": "Positano vs other beaches",
        "guides.meta.positanoCostComparison.description": "Compare costs across Mediterranean resorts.",
        "content.positanoCostComparison.seo.title": "Positano vs other beaches",
        "content.positanoCostComparison.seo.description": "Compare costs across Mediterranean resorts.",
        "content.positanoCostComparison.intro": ["English intro"],
        "content.positanoCostComparison.sections": [
          { title: "Accommodation", body: ["Expect higher nightly rates."] },
        ],
        "content.positanoCostComparison.faqs": [
          { q: "Is Positano expensive?", a: ["Yes, budget accordingly."] },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/positano-cost-vs-other-beach-destinations",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /positano vs other beaches/i }),
      ).resolves.toBeInTheDocument();


      const faqFallback = capturedFaqFallbacks.get("positanoCostComparison");
      expect(faqFallback?.("en")).toEqual([
        { q: "Is Positano expensive?", a: ["Yes, budget accordingly."] },
      ]);
    });
  });

  it("falls back to curated article lead copy when structured data is missing", async () => {
    await withGuideMocks("positanoCostComparison", async ({ renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.positanoCostComparison.title": "Positano vs other beaches",
        "guides.meta.positanoCostComparison.description": "Compare costs across Mediterranean resorts.",
        "content.positanoCostComparison.fallback.sections.overview.heading": "Overview",
        "content.positanoCostComparison.fallback.sections.overview.body": [
          "Overview fallback body",
        ],
        "content.positanoCostComparison.fallback.sections.when.heading": "When to visit",
        "content.positanoCostComparison.fallback.sections.when.body": ["Visit in May or October."],
        "content.positanoCostComparison.fallback.faq.summary": "Is it affordable?",
        "content.positanoCostComparison.fallback.faq.answer": "Yes if you cook at home.",
        "content.positanoCostComparison.fallback.faqLabel": "Key question",
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      setTranslations("es", "guides", {
        "guides.meta.positanoCostComparison.title": "Positano frente a otras playas",
        "guides.meta.positanoCostComparison.description": "Compara los costes con otros destinos.",
        "content.positanoCostComparison.seo.title": "Positano frente a otras playas",
        "content.positanoCostComparison.seo.description": "Compara los costes con otros destinos.",
        "content.positanoCostComparison.intro": [],
        "content.positanoCostComparison.sections": [],
        "content.positanoCostComparison.faqs": [],
        "labels.homeBreadcrumb": "Inicio",
        "labels.guidesBreadcrumb": "Guías",
        "breadcrumbs.home": "Inicio",
        "breadcrumbs.guides": "Guías",
        "content.positanoCostComparison.fallback": {
          toc: [
            { href: "  overview ", label: "  Resumen " },
            { href: "", label: "" },
          ],
          sections: {
            overview: { body: ["Resumen localizado"] },
            when: { heading: "Cuándo visitar", body: ["Evita agosto."] },
          },
          faq: { summary: "¿Es caro?", answer: "Planifica con antelación." },
          faqLabel: "Preguntas clave",
        },
      });

      await renderRoute({
        lang: "es",
        route: "/es/guides/positano-cost-vs-other-beach-destinations",
      });

      await expect(
        screen.findByRole("heading", { level: 2, name: "Cuándo visitar" }),
      ).resolves.toBeInTheDocument();

      expect(genericContentMock).not.toHaveBeenCalled();

      const toc = screen.getByTestId("toc");
      const tocLinks = Array.from(toc.querySelectorAll("a")).map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent?.trim(),
      }));
      expect(tocLinks).toEqual([
        { href: "#overview", text: "Resumen" },
        { href: "#when", text: "Cuándo visitar" },
        { href: "#faq", text: "Preguntas clave" },
      ]);

      expect(screen.getByRole("heading", { level: 3, name: "¿Es caro?" })).toBeInTheDocument();
      expect(screen.getByText("Planifica con antelación.")).toBeInTheDocument();
    });
  });

  it("derives fallback copy from translator keys when fallback payload is sparse", async () => {
    await withGuideMocks("positanoCostComparison", async ({ renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.positanoCostComparison.title": "Positano vs other beaches",
        "guides.meta.positanoCostComparison.description": "Compare costs across Mediterranean resorts.",
        "content.positanoCostComparison.fallback.sections.overview.heading": "English overview",
        "content.positanoCostComparison.fallback.sections.overview.body": [
          "English overview body",
        ],
        "content.positanoCostComparison.fallback.sections.when.heading": "English when heading",
        "content.positanoCostComparison.fallback.sections.when.body": [
          "English when body",
        ],
        "content.positanoCostComparison.fallback.faq.summary": "English FAQ",
        "content.positanoCostComparison.fallback.faq.answer": "English answer",
        "content.positanoCostComparison.fallback.faqLabel": "English FAQ label",
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      setTranslations("fr", "guides", {
        "guides.meta.positanoCostComparison.title": "Comparer Positano",
        "guides.meta.positanoCostComparison.description": "Analyse des coûts pour Positano.",
        "content.positanoCostComparison.seo.title": "Comparer Positano",
        "content.positanoCostComparison.seo.description": "Analyse des coûts pour Positano.",
        "content.positanoCostComparison.intro": [],
        "content.positanoCostComparison.sections": [],
        "content.positanoCostComparison.faqs": [],
        "content.positanoCostComparison.fallback": {},
      });

      await renderRoute({
        lang: "fr",
        route: "/fr/guides/positano-cost-vs-other-beach-destinations",
      });

      expect(genericContentMock).not.toHaveBeenCalled();

      const toc = screen.getByTestId("toc");
      const tocLinks = Array.from(toc.querySelectorAll("a")).map((link) => link.textContent?.trim());
      expect(tocLinks).toEqual(["English overview", "English when heading", "English FAQ label"]);

      expect(screen.getByText("English overview body")).toBeInTheDocument();
      expect(screen.getByText("English answer")).toBeInTheDocument();
    });
  });
});