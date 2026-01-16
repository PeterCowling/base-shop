import { describe, it, expect } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { capturedFaqFallbacks } from "./guides.test-utils";

describe("Limoncello and local cuisine guide", () => {
  it("falls back to English content and gallery metadata when localized entries are empty", async () => {
    await withGuideMocks("limoncelloCuisine", async (ctx) => {
      const { setTranslations, renderRoute, setCurrentLanguage, screen } = ctx;

      setCurrentLanguage("it");

      setTranslations("it", "header", { home: "Casa" });
      setTranslations("it", "guides", {
        "labels.indexTitle": "Guide",
        "content.limoncelloCuisine.seo.title": "Sapori di limone",
        "content.limoncelloCuisine.seo.description": "Degustazioni tradizionali",
        "content.limoncelloCuisine.intro": [] as unknown[],
        "content.limoncelloCuisine.sections": [] as unknown[],
        "content.limoncelloCuisine.faqs": [] as unknown[],
        "content.limoncelloCuisine.gallery": {
          title: " ",
          items: [
            { alt: "   ", caption: "" },
            {},
          ],
        },
      });

      setTranslations("en", "guides", {
        "labels.indexTitle": "Guides",
        "content.limoncelloCuisine.intro": ["Welcome"],
        "content.limoncelloCuisine.sections": [
          { id: "s1", title: "Section", body: ["English body"] },
        ],
        "content.limoncelloCuisine.faqs": [
          { q: "What is limoncello?", a: ["A lemon liqueur."] },
        ],
        "content.limoncelloCuisine.gallery": {
          title: "Photo tour",
          items: [
            { alt: "Primary alt", caption: "Primary caption" },
            { alt: "Secondary alt", caption: "Secondary caption" },
          ],
        },
      });

      await renderRoute({ lang: "it" });

      expect(screen.getByRole("heading", { level: 1, name: "Sapori di limone" })).toBeInTheDocument();
      expect(screen.getByText("Degustazioni tradizionali")).toBeInTheDocument();
      expect(screen.getByText("Welcome")).toBeInTheDocument();

      const gallery = screen.getByTestId("image-gallery");
      const images = gallery.querySelectorAll("img");
      expect(Array.from(images).map((img) => img.getAttribute("alt"))).toEqual([
        "Primary alt",
        "Secondary alt",
      ]);
      const captions = gallery.querySelectorAll("figcaption");
      expect(Array.from(captions).map((node) => node.textContent)).toEqual([
        "Primary caption",
        "Secondary caption",
      ]);

      const faqFallback = capturedFaqFallbacks.get("limoncelloCuisine");
      expect(faqFallback?.("it")).toEqual([{ q: "What is limoncello?", a: ["A lemon liqueur."] }]);
    });
  });

  it("uses localized gallery entries when available and filters incomplete rows", async () => {
    await withGuideMocks("limoncelloCuisine", async (ctx) => {
      const { setTranslations, renderRoute, setCurrentLanguage, screen } = ctx;

      setCurrentLanguage("it");

      setTranslations("it", "header", { home: "Casa" });
      setTranslations("it", "guides", {
        "labels.indexTitle": "Guide",
        "content.limoncelloCuisine.seo.title": "Sapori di limone",
        "content.limoncelloCuisine.seo.description": "Degustazioni tradizionali",
        "content.limoncelloCuisine.intro": ["Benvenuti"],
        "content.limoncelloCuisine.sections": [
          { id: "s1", title: "Titolo", body: ["Corpo"] },
        ],
        "content.limoncelloCuisine.faqs": [
          { q: "Domanda?", a: ["Risposta"] },
        ],
        "content.limoncelloCuisine.gallery": {
          title: " Galleria locale ",
          items: [
            { alt: "Locale alt", caption: "Locale caption" },
            { alt: " ", caption: "" },
          ],
        },
      });

      setTranslations("en", "guides", {
        "content.limoncelloCuisine.gallery": {
          items: [
            { alt: "Fallback alt", caption: "Fallback caption" },
            { alt: "Secondary alt", caption: "Secondary caption" },
          ],
        },
      });

      await renderRoute({ lang: "it" });

      const gallery = screen.getByTestId("image-gallery");
      const images = gallery.querySelectorAll("img");
      expect(images).toHaveLength(1);
      expect(images[0]?.getAttribute("alt")).toBe("Locale alt");
      expect(gallery.querySelector("figcaption")?.textContent).toBe("Locale caption");
      expect(screen.getByRole("heading", { level: 2, name: "Galleria locale" })).toBeInTheDocument();

      const faqFallback = capturedFaqFallbacks.get("limoncelloCuisine");
      expect(faqFallback?.("it")).toEqual([{ q: "Domanda?", a: ["Risposta"] }]);
    });
  });
});