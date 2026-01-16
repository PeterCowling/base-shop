import { describe, expect, it } from "vitest";

import { withGuideMocks } from "../guideTestHarness";

describe("ferry-schedules route – structured content and fallbacks", () => {
  it("renders structured ferry schedules content and surfaces the FAQ fallback handler", async () => {
    await withGuideMocks("ferrySchedules", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "labels.onThisPage": "On this page",
        "labels.tipsHeading": "Tips",
        "labels.faqsHeading": "FAQs",
        "labels.photoGallery": "Gallery",
        "content.ferrySchedules.intro": ["English intro"],
        "content.ferrySchedules.sections": [{ id: "schedule", title: "Schedule", body: ["First"] }],
        "content.ferrySchedules.tips": ["Carry cash"],
        "content.ferrySchedules.faqs": [{ q: "Where to buy?", a: ["At the dock."] }],
        "content.ferrySchedules.galleryTitle": "Gallery",
        "content.ferrySchedules.gallery.items": [
          { alt: "Harbour view", caption: "hero" },
          { alt: "Queue at pier", caption: "secondary" },
        ],
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/ferry-schedules",
      });

      expect(screen.getByTestId("article-structured")).toHaveTextContent("ferrySchedules");
      expect(screen.getAllByText("English intro").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Carry cash").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Where to buy?").length).toBeGreaterThan(0);
      expect(screen.getByTestId("image-gallery")).toBeInTheDocument();

      const tocNavs = screen.getAllByTestId("toc");
      expect(tocNavs.length).toBeGreaterThan(0);
      const tocLabels = tocNavs.flatMap((nav) =>
        Array.from(nav.querySelectorAll("li")).map((item) => item.textContent?.trim()),
      );
      expect(tocLabels).toEqual(expect.arrayContaining(["Tips", "FAQs"]));

      setTranslations("de", "guides", {
        "content.ferrySchedules.intro": [],
        "content.ferrySchedules.sections": [],
        "content.ferrySchedules.tips": [],
        "content.ferrySchedules.faqs": [],
      });
      setTranslations("de", "guidesFallback", {
        "ferrySchedules.faqs": [{ q: "Wo kaufe ich Tickets?", a: ["Am Hafen."] }],
      });

      await renderRoute({
        lang: "de",
        route: "/de/guides/ferry-schedules",
      });

      expect(screen.getAllByText("Wo kaufe ich Tickets?").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Am Hafen.").length).toBeGreaterThan(0);
    });
  });
});