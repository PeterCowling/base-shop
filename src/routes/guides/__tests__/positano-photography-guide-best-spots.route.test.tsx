import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { capturedFaqFallbacks, setTranslations } from "./guides.test-utils";

describe("positano photography guide", () => {
  it("renders localized structured content when translators are populated", async () => {
    await withGuideMocks("photographyGuidePositano", async ({ renderRoute, screen, setTranslations }) => {
      setTranslations("en", "guides", {
        "guides.meta.photographyGuidePositano.title": "Positano photography guide",
        "guides.meta.photographyGuidePositano.description": "Capture the best angles in Positano.",
        "content.photographyGuidePositano.seo.title": "Positano photography guide",
        "content.photographyGuidePositano.seo.description": "Capture the best angles in Positano.",
        "content.photographyGuidePositano.intro": ["Start at Marina Grande before sunrise."],
        "content.photographyGuidePositano.sections": [
          { id: "spot-1", title: "Sunrise viewpoints", body: ["Climb the hill for golden light."] },
        ],
        "content.photographyGuidePositano.faqs": [
          { q: "Do I need a tripod?", a: ["Yes, for long exposures."] },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "labels.indexTitle": "Guides index",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/positano-photography-guide-best-spots",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /positano photography guide/i }),
      ).resolves.toBeInTheDocument();

      expect(screen.getByTestId("generic-photographyGuidePositano")).toBeInTheDocument();

      const faqFallback = capturedFaqFallbacks.get("photographyGuidePositano");
      expect(faqFallback?.("en")).toEqual([{ q: "Do I need a tripod?", a: ["Yes, for long exposures."] }]);
    });
  });

  it("falls back to curated guide copy when localized arrays are empty", async () => {
    await withGuideMocks("photographyGuidePositano", async ({ renderRoute, screen, setTranslations }) => {
      setTranslations("en", "guides", {
        "content.photographyGuidePositano.fallback": {
          toc: [{ href: "#spot-uno", label: "Primary view" }],
          sections: {
            "spot-uno": {
              heading: "Primary view",
              body: ["Fallback overview"],
            },
          },
        },
      });

      setTranslations("es", "guides", {
        "guides.meta.photographyGuidePositano.title": "Guía de fotografía en Positano",
        "guides.meta.photographyGuidePositano.description": "Encuentra los mejores encuadres al atardecer.",
        "content.photographyGuidePositano.seo.title": "Guía de fotografía en Positano",
        "content.photographyGuidePositano.seo.description": "Encuentra los mejores encuadres al atardecer.",
        "content.photographyGuidePositano.intro": [],
        "content.photographyGuidePositano.sections": [],
        "content.photographyGuidePositano.faqs": [],
        "labels.indexTitle": "Guías",
        "labels.homeBreadcrumb": "Inicio",
        "labels.guidesBreadcrumb": "Guías",
        "breadcrumbs.home": "Inicio",
        "breadcrumbs.guides": "Guías",
        "content.photographyGuidePositano.fallback": {
          toc: [
            { href: "  spot-uno  ", label: "  Mirador perfecto  " },
          ],
          sections: {
            "spot-uno": {
              title: " Vista principal ",
              body: ["Primer párrafo", "  Segundo párrafo  "],
            },
          },
        },
      });

      await renderRoute({
        lang: "es",
        route: "/es/guides/positano-photography-guide-best-spots",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /guía de fotografía en positano/i }),
      ).resolves.toBeInTheDocument();

      const toc = screen.getByTestId("toc");
      const links = Array.from(toc.querySelectorAll("a")).map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent?.trim(),
      }));
      expect(links).toEqual([{ href: "#spot-uno", text: "Mirador perfecto" }]);

      expect(screen.getByRole("heading", { level: 2, name: "Vista principal" })).toBeInTheDocument();
      expect(screen.getByText("Primer párrafo")).toBeInTheDocument();

      const faqFallback = capturedFaqFallbacks.get("photographyGuidePositano");
      expect(faqFallback?.("es")).toEqual([]);
    });
  });
});