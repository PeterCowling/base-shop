import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";

import { withGuideMocks } from "./guideTestHarness";

const BASE_META = {
  "guides.meta.positanoBeaches.title": "Positano beaches guide",
  "guides.meta.positanoBeaches.description": "Plan which Positano beaches fit your vibe.",
} as const;

describe("positano-beaches route", () => {
  it("renders structured content with localized fallbacks", async () => {
    await withGuideMocks(
      "positanoBeaches",
      async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("fr", "guides", {
        ...BASE_META,
        "content.beaches.seo.title": "Positano beaches guide",
        "content.beaches.seo.description": "Plan which Positano beaches fit your vibe.",
        "labels.faqsHeading": "Questions fréquentes",
        "content.positanoBeaches": {
          intro: ["Intro paragraph"],
          sections: [
            { id: "section-one", title: "Section One", body: ["Body copy"] },
            { id: "section-two", title: "Section Two", body: ["Second body"] },
          ],
          gallery: [{ alt: "Alt 1", caption: "Cap 1" }],
          faqs: [
            { q: "What?", a: "Because" },
            { q: "How?", a: ["Carefully", "Boldly"] },
          ],
        },
      });

      setTranslations("en", "guides", {
        "content.beaches.seo.title": "Fallback title",
        "content.beaches.seo.description": "Fallback description",
        "labels.faqsHeading": "FAQs",
        "content.positanoBeaches": {
          toc: [{ href: "#section-one", label: "Section one" }],
          prosCons: [
            {
              title: "Stay",
              pros: ["Facilities nearby"],
              cons: ["Crowded in summer"],
              guideKey: "fornilloBeachGuide",
            },
          ],
          itemList: [
            { name: "Beach Alpha", note: "Sheltered" },
            { name: "Beach Beta", note: "Family friendly" },
          ],
          gallery: [
            { alt: "Fallback Alt 1", caption: "Fallback Cap 1" },
            { alt: "Fallback Alt 2", caption: "Fallback Cap 2" },
          ],
          galleryTitle: "Fallback gallery",
          faqs: [{ q: "Fallback?", a: "Fallback answer" }],
        },
      });

      await renderRoute({ lang: "fr" });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Positano beaches guide");

      const [localizedToc] = screen.getAllByTestId("toc");
      expect(localizedToc).toBeTruthy();
      const tocRegion = localizedToc as HTMLElement;
      const faqLink = within(tocRegion).getByRole("link", { name: /Questions fréquentes/i });
      expect(faqLink).toHaveAttribute("href", "#faqs");

      const gallery = screen.getByTestId("image-gallery");
      const galleryImages = within(gallery).getAllByRole("img");
      expect(galleryImages[0]).toHaveAttribute("alt", "Alt 1");
      expect(galleryImages[1]).toHaveAttribute("alt", "Fallback Alt 2");

      const captions = Array.from(gallery.querySelectorAll("figcaption")).map((node) =>
        node.textContent?.trim(),
      );
      expect(captions).toEqual(["Cap 1", "Fallback Cap 2"]);

      expect(screen.getByText("Stay")).toBeInTheDocument();

      const faqSection = document.querySelector("#faqs");
      expect(faqSection).toBeTruthy();
      const faqRegion = within(faqSection as HTMLElement);
      expect(faqRegion.getByText("What?")).toBeInTheDocument();
      expect(faqRegion.getByText("How?")).toBeInTheDocument();
      expect(faqRegion.getByText("Because")).toBeInTheDocument();
      expect(faqRegion.getByText("Carefully")).toBeInTheDocument();

      const jsonLd = document.querySelector('script[type="application/ld+json"]')?.textContent ?? "";
      expect(jsonLd).toContain("Beach Alpha");

      expect(screen.queryByTestId("generic-content")).toBeNull();
      },
      { harness: { syntheticToc: "off" } },
    );
  });

  it("falls back to generic content when no structured data exists", async () => {
    await withGuideMocks("positanoBeaches", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("fr", "guides", {
        ...BASE_META,
        "content.beaches.seo.title": "Fallback beaches title",
        "content.beaches.seo.description": "Fallback beaches description",
        "content.positanoBeaches": {},
      });

      setTranslations("en", "guides", {
        "content.beaches.seo.title": "Fallback beaches title",
        "content.beaches.seo.description": "Fallback beaches description",
        "content.positanoBeaches": {
          itemList: [{ name: "Fallback", note: "Note" }],
        },
      });

      await renderRoute({ lang: "fr" });

      expect(screen.queryAllByTestId("toc")).toHaveLength(0);
      expect(screen.queryByTestId("image-gallery")).toBeNull();
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.queryByRole("button", { name: /fallback\?/i })).toBeNull();
      const structured = screen.getByTestId("article-structured");
      expect(structured.getAttribute("data-description")).toBe("Fallback beaches description");
      expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain("Fallback");
    });
  });
});