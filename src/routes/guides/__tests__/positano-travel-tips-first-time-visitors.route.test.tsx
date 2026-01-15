import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import {
  genericContentMock,
  capturedFaqFallbacks,
  setTranslations,
} from "./guides.test-utils";

describe("positano travel tips for first-time visitors", () => {
  it("renders structured article sections, normalised toc entries, and guide links", async () => {
    await withGuideMocks("travelTipsFirstTime", async ({ renderRoute, screen, setTranslations }) => {
      setTranslations("en", "guides", {
        "guides.meta.travelTipsFirstTime.title": "Travel tips for first timers",
        "guides.meta.travelTipsFirstTime.description": "Plan the perfect Positano arrival.",
        "content.travelTipsFirstTime.seo.title": "Travel tips for first timers",
        "content.travelTipsFirstTime.seo.description": "Plan the perfect Positano arrival.",
        "content.travelTipsFirstTime.sections": [
          {
            id: "welcome",
            title: "Welcome",
            paragraphs: ["  Arrive a day early for buffer time.  ", 42],
            list: ["  Confirm check-in  ", null],
            links: [
              { guideKey: "whatToPack", label: "What to pack" },
              { key: "dayTripsPositano", label: "Day trips" },
              { key: "invalidKey", label: "Skip me" },
            ],
          },
          {
            id: "logistics",
            title: "Logistics",
            body: ["Pick up porter tokens at the ferry dock."],
            list: [],
            links: [],
          },
          {
            id: "",
            title: "",
            paragraphs: [],
            list: [],
          },
        ],
        "content.travelTipsFirstTime.toc": [
          { href: "  #welcome  ", label: "  Welcome  " },
          { href: "#logistics", label: "Logistics" },
          { href: "", label: "Empty" },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/positano-travel-tips-first-time-visitors",
      });

      await expect(
        screen.findByRole("heading", { level: 2, name: "Welcome" }),
      ).resolves.toBeInTheDocument();
      expect(screen.getByText("Arrive a day early for buffer time.")).toBeInTheDocument();
      expect(screen.getByText("Confirm check-in")).toBeInTheDocument();

      const guideLinks = screen.getAllByRole("link").filter((link) =>
        (link.getAttribute("href") ?? "").startsWith("/"),
      );
      const hrefs = guideLinks.map((link) => link.getAttribute("href"));
      expect(hrefs).toContain("/en/guides/what-to-pack-amalfi-coast");

      const toc = screen.getByTestId("toc");
      const tocEntries = Array.from(toc.querySelectorAll("a")).map((link) => ({
        href: link.getAttribute("href"),
        text: link.textContent?.trim(),
      }));
      expect(tocEntries).toEqual([
        { href: "#welcome", text: "Welcome" },
        { href: "#logistics", text: "Logistics" },
      ]);

      expect(genericContentMock).not.toHaveBeenCalled();
    });
  });

  it("falls back to GenericContent when structured sections are missing", async () => {
    await withGuideMocks("travelTipsFirstTime", async ({ renderRoute }) => {
      setTranslations("en", "guides", {
        "content.travelTipsFirstTime.intro": ["English intro"],
        "content.travelTipsFirstTime.sections": [
          { id: "welcome", title: "Welcome", paragraphs: ["Intro paragraph"] },
        ],
        "content.travelTipsFirstTime.faqs": [
          { q: "Is Positano accessible?", a: ["Expect lots of stairs."] },
        ],
      });

      setTranslations("fr", "guides", {
        "content.travelTipsFirstTime.seo.title": "Conseils pour une première visite",
        "content.travelTipsFirstTime.seo.description": "Organisez votre arrivée à Positano.",
        "content.travelTipsFirstTime.intro": [],
        "content.travelTipsFirstTime.sections": [],
        "content.travelTipsFirstTime.faqs": [],
      });

      await renderRoute({
        lang: "fr",
        route: "/fr/guides/positano-travel-tips-first-time-visitors",
      });

      expect(genericContentMock).toHaveBeenCalledWith(
        expect.objectContaining({ guideKey: "travelTipsFirstTime" }),
      );

      const faqFallback = capturedFaqFallbacks.get("travelTipsFirstTime");
      expect(faqFallback?.("fr")).toEqual([
        { q: "Is Positano accessible?", a: ["Expect lots of stairs."] },
      ]);
    });
  });
});