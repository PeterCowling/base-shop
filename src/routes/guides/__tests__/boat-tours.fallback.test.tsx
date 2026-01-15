import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";
import { assertRouteHead } from "@tests/head";

import { withGuideMocks } from "./guideTestHarness";
import { guideHref } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { guideAreaToSlugKey } from "../guide-manifest";

const BASE_TRANSLATIONS = {
  "labels.homeBreadcrumb": "Home",
  "labels.guidesBreadcrumb": "Guides",
} as const;

describe("Boat tours guide fallback behaviour", () => {
  it("falls back to English metadata and gallery content when localized strings are blank", async () => {
    await withGuideMocks("boatTours", async ({ setTranslations, renderRoute, screen, manifestEntry }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.boatTours.seo.title": "Boat tours from Positano",
        "content.boatTours.seo.description": "Plan private or shared charters",
        "content.boatTours.intro": ["Sail along the Amalfi Coast"],
        "content.boatTours.sections": [
          { id: "shared", title: "Shared departures", body: ["Budget-friendly morning sailings"] },
        ],
        "content.boatTours.faqs": [{ q: "Do I need cash?", a: ["Carry euros for tips"] }],
        "content.boatTours.galleryHeading": "Charter moments",
        "content.boatTours.gallery.primaryAlt": "Boat near Positano cliffs",
        "content.boatTours.gallery.primaryCaption": "Sunset aperitivo",
        "content.boatTours.gallery.secondaryAlt": "Guests swimming in Amalfi bay",
        "content.boatTours.gallery.secondaryCaption": "Swim stop at Li Galli",
      });

      setTranslations("es", "guides", {
        ...BASE_TRANSLATIONS,
        "content.boatTours.seo.title": " ",
        "content.boatTours.seo.description": "",
        "content.boatTours.intro": [],
        "content.boatTours.sections": [],
        "content.boatTours.faqs": [],
        "content.boatTours.galleryHeading": "",
        "content.boatTours.gallery.primaryAlt": " ",
        "content.boatTours.gallery.primaryCaption": "",
        "content.boatTours.gallery.secondaryAlt": "",
        "content.boatTours.gallery.secondaryCaption": " ",
      });

      const lang = "es";
      await renderRoute({ lang });

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Boat tours from Positano");
      const path = guideHref(lang, manifestEntry.key, { forceGuidesBase: true });
      assertRouteHead({
        title: "Boat tours from Positano",
        description: "Plan private or shared charters",
        lang,
        path,
        image: {},
        ogType: "article",
      });

      expect(screen.getByRole("heading", { level: 2, name: "Charter moments" })).toBeInTheDocument();

      const gallery = screen.getByTestId("image-gallery");
      const images = within(gallery).getAllByRole("img");
      expect(images[0]).toHaveAttribute("alt", "Boat near Positano cliffs");
      expect(images[1]).toHaveAttribute("alt", "Guests swimming in Amalfi bay");
      expect(within(gallery).getByText("Sunset aperitivo")).toBeInTheDocument();
    });
  });

  it("prefers localized metadata and gallery strings when available", async () => {
    await withGuideMocks("boatTours", async ({ setTranslations, renderRoute, screen, manifestEntry }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.boatTours.seo.title": "Boat tours from Positano",
        "content.boatTours.seo.description": "Plan private or shared charters",
        "content.boatTours.galleryHeading": "Charter moments",
        "content.boatTours.gallery.primaryAlt": "Boat near Positano cliffs",
        "content.boatTours.gallery.secondaryAlt": "Guests swimming in Amalfi bay",
      });

      setTranslations("it", "guides", {
        ...BASE_TRANSLATIONS,
        "content.boatTours.seo.title": "Tour in barca da Positano",
        "content.boatTours.seo.description": "Prenota uscite private o condivise",
        "content.boatTours.intro": ["Salpa con skipper locali"],
        "content.boatTours.sections": [
          { id: "privati", title: "Tour privati", body: ["Skipper dedicato e prosecco"] },
        ],
        "content.boatTours.faqs": [{ q: "Serve deposito?", a: ["Consigliamo il 30%"] }],
        "content.boatTours.galleryHeading": "Momenti in barca",
        "content.boatTours.gallery.primaryAlt": "Vista di Positano dal mare",
        "content.boatTours.gallery.primaryCaption": "",
        "content.boatTours.gallery.secondaryAlt": "Tuffo al tramonto",
        "content.boatTours.gallery.secondaryCaption": "",
      });

      const lang = "it";
      await renderRoute({ lang });

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tour in barca da Positano");
      const path = guideHref(lang, manifestEntry.key, { forceGuidesBase: true });
      assertRouteHead({
        title: "Tour in barca da Positano",
        description: "Prenota uscite private o condivise",
        lang,
        path,
        image: {},
        ogType: "article",
      });

      expect(screen.getByRole("heading", { level: 2, name: "Momenti in barca" })).toBeInTheDocument();

      const gallery = screen.getByTestId("image-gallery");
      const images = within(gallery).getAllByRole("img");
      expect(images[0]).toHaveAttribute("alt", "Vista di Positano dal mare");
      expect(images[1]).toHaveAttribute("alt", "Tuffo al tramonto");
      expect(within(gallery).queryByText("Sunset aperitivo")).toBeNull();
    });
  });
});