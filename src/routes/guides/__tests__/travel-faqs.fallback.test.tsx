import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { capturedFaqFallbacks } from "./guides.test-utils";

describe("Amalfi Coast travel FAQs route", () => {
  it("renders GenericContent when structured FAQs exist for the active locale", async () => {
    await withGuideMocks("travelFaqsAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.travelFaqsAmalfi.seo.title": "Travel FAQs",
        "content.travelFaqsAmalfi.seo.description": "Common questions",
        "labels.onThisPage": "On this page",
        "content.travelFaqsAmalfi.intro": ["Intro"],
        "content.travelFaqsAmalfi.sections": [
          { id: "transport", title: "Transport essentials", body: ["Check timetables."] },
        ],
        "content.travelFaqsAmalfi.faqs": [
          { q: "Do ferries run in winter?", a: ["No"] },
        ],
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/amalfi-coast-travel-faqs",
      });

      expect(screen.getByTestId("generic-travelFaqsAmalfi")).toBeInTheDocument();
    });
  });

  it("falls back to English FAQs when the current language lacks structured content", async () => {
    await withGuideMocks("travelFaqsAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.travelFaqsAmalfi.intro": ["Intro"],
        "content.travelFaqsAmalfi.sections": [
          { id: "transport", title: "Transport essentials", body: ["Check timetables."] },
        ],
        "content.travelFaqsAmalfi.faqs": [
          { q: "Do ferries run in winter?", a: ["No"] },
        ],
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/amalfi-coast-travel-faqs",
      });

      const fallbackHandler = capturedFaqFallbacks.get("travelFaqsAmalfi");
      expect(typeof fallbackHandler).toBe("function");

      setTranslations("fr", "guides", {
        "content.travelFaqsAmalfi.seo.title": "FAQ voyage",
        "content.travelFaqsAmalfi.seo.description": "Questions fréquentes",
        "content.travelFaqsAmalfi.intro": [],
        "content.travelFaqsAmalfi.sections": [],
        "content.travelFaqsAmalfi.faqs": [],
        "content.travelFaqsAmalfi.faq": [],
      });

      setTranslations("en", "guides", {
        "content.travelFaqsAmalfi.faqs": [
          { q: "Is cash accepted everywhere?", a: ["Most small shops prefer cash"] },
        ],
      });
      setTranslations("fr", "guidesFallback", {
        "travelFaqsAmalfi.faqs": [
          { q: "Is cash accepted everywhere?", a: ["Most small shops prefer cash"] },
        ],
      });

      await renderRoute({
        lang: "fr",
        route: "/fr/guides/amalfi-coast-travel-faqs",
      });

      expect(screen.queryByTestId("generic-travelFaqsAmalfi")).toBeNull();
      expect(screen.getAllByText(/cash accepted/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Most small shops prefer cash/i).length).toBeGreaterThan(0);
    });
  });
});