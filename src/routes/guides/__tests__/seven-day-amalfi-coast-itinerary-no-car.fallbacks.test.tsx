import { describe, it, expect } from "vitest";
import { within } from "@testing-library/react";

import { withGuideMocks } from "./guideTestHarness";
import { capturedFaqFallbacks, genericContentMock } from "./guides.test-utils";

describe("Seven-day Amalfi Coast itinerary without a car", () => {
  it("renders translated itinerary content while honouring fallbacks", async () => {
    await withGuideMocks(
      "sevenDayNoCar",
      async (ctx) => {
      const { renderRoute, screen, setTranslations, setCurrentLanguage } = ctx;

      setCurrentLanguage("en");

      setTranslations("en", "header", { home: "Home" });

      setTranslations("en", "guides", {
        "labels.indexTitle": "Guides",
        "content.sevenDayNoCar.seo.title": "Seven days without a car",
        "content.sevenDayNoCar.seo.description": "Plan every day on foot",
        "content.sevenDayNoCar.intro": "",
        "content.sevenDayNoCar.toc": {
          onThisPage: "Itinerary overview",
          overview: "",
          dayByDay: "Daily highlights",
          tips: "",
          faqs: "",
          day1: "Custom first day",
        },
        "content.sevenDayNoCar.days": [
          { id: "day1", label: "Translated first day", items: ["Custom intro"] },
          { id: "day2", label: "Second day", items: ["Translated agenda"] },
          { id: "day3", label: "Day 3", items: [] },
        ],
        "content.sevenDayNoCar.day3": ["Structured fallback"],
        "content.sevenDayNoCar.tips": [],
        "content.sevenDayNoCar.faq": [
          { q: "", a: "Translated single answer" },
          { q: "Translated curiosity", a: ["Stay flexible", "  "] },
        ],
      });

      setTranslations("en", "guidesFallback", {
        "sevenDayNoCar.intro": "Fallback introduction paragraph",
        "sevenDayNoCar.toc": {
          onThisPage: "On this page",
          overview: "Overview",
          dayByDay: "Day-by-day plan",
          tips: "Travel tips",
          faqs: "FAQs",
          day1: "Fallback day one",
          day3: "Fallback day three",
        },
        "sevenDayNoCar.days": [
          { id: "", label: "", items: ["Fallback opening day"] },
          { id: "day2", label: "Day two fallback", items: [] },
          { id: "day3", label: "", items: [] },
        ],
        "sevenDayNoCar.tips": ["Carry cash for ferries"],
        "sevenDayNoCar.faq": [
          { q: "Fallback curiosity", a: ["Fallback answer"] },
          { q: "", a: ["Unused"] },
        ],
      });

      setTranslations("fr", "guidesFallback", {
        "sevenDayNoCar.faq": [
          { q: "Question FR", a: ["Réponse 1", "  "] },
          { q: undefined, a: "Extra" },
        ],
      });


      const { container } = await renderRoute({
        harness: { genericContent: "force", syntheticToc: "off" },
      });

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Seven days without a car");
      expect(screen.getByTestId("article-structured")).toHaveAttribute(
        "data-description",
        "Plan every day on foot",
      );
      expect(screen.queryByTestId("toc")).toBeNull();

      // eslint-disable-next-line no-console
      console.log("generic calls", genericContentMock.mock.calls.length);

      const dayList = screen.getByTestId("day-list-sevenDayNoCar");
      const dayItems = within(dayList).getAllByRole("listitem");
      expect(dayItems[0]?.textContent).toContain("Translated first day");
      expect(dayItems[0]?.textContent).toContain("Custom intro");
      expect(dayItems[1]?.textContent).toContain("Second day");
      expect(dayItems[1]?.textContent).toContain("Translated agenda");
      expect(dayItems[2]?.textContent).toContain("Day 3");
      expect(dayItems[2]?.textContent).toContain("Structured fallback");

      const faqDetails = container.querySelectorAll("article details");
      expect(faqDetails).toHaveLength(1);
      expect(faqDetails[0]?.querySelector("summary")?.textContent).toBe("Translated curiosity");
      expect(faqDetails[0]?.textContent).toContain("Stay flexible");

      expect(genericContentMock).toHaveBeenCalledWith(expect.objectContaining({ guideKey: "sevenDayNoCar" }));

      const fallbackFn = capturedFaqFallbacks.get("sevenDayNoCar");
      expect(typeof fallbackFn).toBe("function");

      const fallbackFaq = fallbackFn?.("fr");
      expect(fallbackFaq).toEqual([
        { q: "Question FR", a: ["Réponse 1"] },
        { q: undefined, a: ["Extra"] },
      ]);
    });
  });
});