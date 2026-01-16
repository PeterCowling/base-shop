import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";

import { withGuideMocks } from "./guideTestHarness";

const BASE_TRANSLATIONS = {
  "content.itinerariesPillar.seo.title": "No-car itineraries",
  "content.itinerariesPillar.seo.description": "Plan options",
  "labels.indexTitle": "Guides",
} as const;

describe("Amalfi Coast itineraries without a car", () => {
  it("renders structured itinerary content when localized strings are available", async () => {
    await withGuideMocks("itinerariesPillar", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.itinerariesPillar.intro": "Structured intro",
        "content.itinerariesPillar.days": [
          {
            id: "two-days",
            label: "Two days",
            items: ["Catch the early ferry"],
          },
        ],
        "content.itinerariesPillar.tips": ["Book ferries early"],
        "content.itinerariesPillar.tipsTitle": "Translated tips",
        "content.itinerariesPillar.faq": [
          { q: "How busy?", a: ["Plan ahead"] },
        ],
        "content.itinerariesPillar.faqTitle": "Translated FAQ",
      });

      setTranslations("en", "guidesFallback", {
        "itinerariesPillar.tipsHeading": "Fallback tips",
        "itinerariesPillar.faqHeading": "Fallback FAQ",
        "itinerariesPillar.faqs": [
          { question: "Fallback question", answer: ["Fallback answer"] },
        ],
      });

      await renderRoute({ lang: "en" });

      expect(screen.getByText("Structured intro")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Translated tips" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Translated FAQ" })).toBeInTheDocument();
      expect(screen.getByText("Book ferries early")).toBeInTheDocument();
    });
  });

  it("uses fallback itinerary copy when structured content is missing", async () => {
    await withGuideMocks("itinerariesPillar", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.itinerariesPillar.intro": "",
        "content.itinerariesPillar.days": [],
        "content.itinerariesPillar.tips": [],
        "content.itinerariesPillar.faq": [],
      });

      setTranslations("en", "guidesFallback", {
        "itinerariesPillar.intro": "Fallback intro",
        "itinerariesPillar.toc": {
          twoDays: "48 hours",
          threeDays: "72 hours",
          sevenDays: "Full week",
          tips: "Advice",
          faqs: "FAQs",
        },
        "itinerariesPillar.twoDaysHeading": "Two-day plan",
        "itinerariesPillar.twoDaysItems": ["Hike the Path"],
        "itinerariesPillar.threeDaysHeading": "Three-day plan",
        "itinerariesPillar.threeDaysIntro": "Pick one option",
        "itinerariesPillar.threeDaysOptions": ["Stay in Amalfi"],
        "itinerariesPillar.sevenDaysHeading": "Seven-day plan",
        "itinerariesPillar.sevenDaysItems": ["Explore Ravello"],
        "itinerariesPillar.tipsHeading": "Travel tips",
        "itinerariesPillar.tips": ["Validate tickets"],
        "itinerariesPillar.faqHeading": "Fallback FAQ",
        "itinerariesPillar.faqs": [
          { question: "Are buses frequent?", answer: ["Every 30 minutes"] },
        ],
      });

      await renderRoute({ lang: "en" });

      expect(screen.getByText("Fallback intro")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Two-day plan" })).toBeInTheDocument();
      expect(screen.getByText("Stay in Amalfi")).toBeInTheDocument();
      expect(screen.getByText("Travel tips")).toBeInTheDocument();
      expect(screen.getByText("Are buses frequent?")).toBeInTheDocument();

      const toc = screen.getByTestId("toc");
      const items = within(toc).getAllByRole("listitem").map((li) => li.textContent?.trim());
      expect(items).toContain("48 hours");
      expect(items).toContain("Advice");
    });
  });
});