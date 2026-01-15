import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";

import { withGuideMocks } from "./guideTestHarness";

const BASE_TRANSLATIONS = {
  "guides.meta.naplesPositano.title": "Naples to Positano",
  "guides.meta.naplesPositano.description": "Door-to-door route from Naples to Hostel Brikette.",
  "content.naplesPositano.seo.title": "Naples to Positano",
  "content.naplesPositano.seo.description": "Door-to-door route from Naples to Hostel Brikette.",
  "labels.homeBreadcrumb": "Home",
  "labels.guidesBreadcrumb": "Guides",
  "breadcrumbs.home": "Home",
  "breadcrumbs.guides": "Guides",
} as const;

describe("naples-to-positano route", () => {
  it("renders article content through the shared guide template", async () => {
    await withGuideMocks("naplesPositano", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.naplesPositano.intro": ["Intro paragraph"],
        "content.naplesPositano.sections": [{ id: "steps", title: "Step-by-step", body: ["Validate tickets."] }],
        "content.naplesPositano.toc": [{ href: "#steps", label: "Step-by-step" }],
      });

      await renderRoute({ lang: "en" });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Naples to Positano");
      expect(screen.getByTestId("generic-naplesPositano")).toBeInTheDocument();
    });
  });

  it("normalises gallery items when localized content is provided", async () => {
    await withGuideMocks("naplesPositano", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.naplesPositano.intro": [],
        "content.naplesPositano.sections": [],
        "content.naplesPositano.gallery": {
          title: "  ",
          items: [
            { src: "  /img/ferry.avif  ", caption: "  Riding  ", width: 640, height: 480 },
            { src: "/img/bus.avif", caption: " Bus ride " },
            { alt: "Missing source" },
          ],
        },
        "content.naplesPositano.toc.gallery": "   ",
        "labels.photoGallery": "  Photo moments  ",
      });

      await renderRoute({ lang: "en" });

      const gallery = screen.getByTestId("image-gallery");
      const images = within(gallery).getAllByRole("img");
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute("alt", "Photo moments");
      expect(images[1]).toHaveAttribute("alt", "Photo moments");

      const captions = Array.from(gallery.querySelectorAll("figcaption")).map((node) => node.textContent?.trim());
      expect(captions).toEqual(["Riding", "Bus ride"]);
    });
  });

  it("omits the gallery when no items can be normalised", async () => {
    await withGuideMocks("naplesPositano", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.naplesPositano.intro": [],
        "content.naplesPositano.sections": [],
        "content.naplesPositano.gallery": {
          title: "Gallery",
          items: [{ src: "   " }, { alt: "No source" }],
        },
      });

      await renderRoute({ lang: "en" });

      expect(screen.queryByTestId("image-gallery")).toBeNull();
    });
  });
});