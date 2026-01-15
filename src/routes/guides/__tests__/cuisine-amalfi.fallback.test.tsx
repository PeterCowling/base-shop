import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";

import { withGuideMocks } from "./guideTestHarness";

const BASE_TRANSLATIONS = {
  "content.cuisineAmalfiGuide.seo.title": "Amalfi Coast cuisine guide",
  "content.cuisineAmalfiGuide.seo.description": "Signature dishes and where to try them",
  "labels.homeBreadcrumb": "Home",
  "labels.guidesBreadcrumb": "Guides",
} as const;

describe("Amalfi Coast cuisine guide", () => {
  it("renders localized structured content including item lists and gallery", async () => {
    await withGuideMocks("cuisineAmalfiGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.cuisineAmalfiGuide.intro": ["Plan your tastings"],
        "content.cuisineAmalfiGuide.sections": [
          { id: "pasta", title: "Fresh pasta", body: ["Scialatielli with lemon and clams"] },
        ],
        "content.cuisineAmalfiGuide.faqs": [],
        "content.cuisineAmalfiGuide.itemList": [
          { name: "Delizie al limone", note: "Lemon cream sponge" },
          { name: "Scialatielli", note: "Hand-cut pasta" },
        ],
        "content.cuisineAmalfiGuide.itemListTitle": "Signature dishes",
        "content.cuisineAmalfiGuide.gallery.title": "Flavours of the coast",
        "content.cuisineAmalfiGuide.gallery.items": [
          { alt: "Seafood platter", caption: "Citrus-marinated anchovies" },
          { alt: "Lemon dessert", caption: "" },
          { alt: "Limoncello bottles", caption: "Homemade digestivo" },
        ],
      });

      await renderRoute({ lang: "en" });

      expect(screen.getByRole("heading", { level: 2, name: "Signature dishes" })).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByRole("heading", { level: 2, name: "Flavours of the coast" })).toBeInTheDocument();
      expect(screen.getByAltText("Seafood platter")).toBeInTheDocument();
      expect(screen.getByText("Citrus-marinated anchovies")).toBeInTheDocument();
      expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull();
    });
  });

  it("falls back to structured sections and toc when localized content is missing", async () => {
    await withGuideMocks("cuisineAmalfiGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.cuisineAmalfiGuide.fallback": {
          toc: [{ href: "#coffee", label: "Coffee culture" }],
          sections: [{ id: "coffee", title: "Coffee culture", body: ["Order caffè normale at the bar"] }],
        },
      });

      setTranslations("fr", "guides", {
        ...BASE_TRANSLATIONS,
        "content.cuisineAmalfiGuide.seo.title": "Cuisine de la Côte Amalfitaine",
        "content.cuisineAmalfiGuide.seo.description": "Spécialités locales à goûter",
        "labels.homeBreadcrumb": "Accueil",
        "labels.guidesBreadcrumb": "Guides",
        "content.cuisineAmalfiGuide.intro": [],
        "content.cuisineAmalfiGuide.sections": [],
        "content.cuisineAmalfiGuide.faqs": [],
        "content.cuisineAmalfiGuide.itemList": [],
        "content.cuisineAmalfiGuide.gallery.items": [],
        "content.cuisineAmalfiGuide.fallback": {
          toc: [{ href: "#patisseries", label: "Pâtisseries" }],
          sections: [
            { id: "patisseries", title: "Pâtisseries locales", body: ["Essayez les sfogliatelle croustillantes"] },
          ],
        },
      });

      await renderRoute({ lang: "fr" });

      const toc = screen.getByTestId("toc");
      expect(within(toc).getByText("Pâtisseries")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Pâtisseries locales" })).toBeInTheDocument();
      expect(screen.getByText("Essayez les sfogliatelle croustillantes")).toBeInTheDocument();
      expect(screen.queryByTestId("generic-cuisineAmalfiGuide")).toBeNull();
      expect(screen.queryByRole("img")).toBeNull();
    });
  });
});