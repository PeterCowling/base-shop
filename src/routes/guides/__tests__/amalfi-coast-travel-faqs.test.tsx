import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("amalfi-coast-travel-faqs", () => {
  it("renders localized FAQs when structured data exists", async () => {
    await withGuideMocks("travelFaqsAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.travelFaqsAmalfi.seo.title": "FAQ viaggio Amalfi",
        "content.travelFaqsAmalfi.seo.description": "Risposte utili",
        "content.travelFaqsAmalfi.intro": ["Intro"],
        "content.travelFaqsAmalfi.sections": [
          { id: "money", title: "Pagamenti", body: ["Porta contanti"] },
        ],
        "content.travelFaqsAmalfi.faqs": [
          { q: "Serve contanti?", a: ["Sì, spesso"] },
        ],
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/amalfi-coast-travel-faqs",
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/amalfi-coast-travel-faqs",
      });

      const article = await screen.findByTestId("article-structured");
      expect(article).toHaveTextContent(/faq viaggio amalfi/i);
      expect(screen.getByTestId("faq-json-travelFaqsAmalfi")).toBeInTheDocument();
    });
  });

  it("falls back to English FAQs when locale arrays are empty", async () => {
    await withGuideMocks("travelFaqsAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.travelFaqsAmalfi.intro": [],
        "content.travelFaqsAmalfi.sections": [],
        "content.travelFaqsAmalfi.faqs": [],
      });

      setTranslations("en", "guides", {
        "content.travelFaqsAmalfi.faqs": [
          { q: "Do buses run late?", a: ["Only until 10pm"] },
        ],
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/amalfi-coast-travel-faqs",
      });

      const article = await screen.findByTestId("article-structured");
      expect(article).toHaveTextContent(/amalfi coast travel faqs/i);
      expect(screen.getByTestId("faq-json-travelFaqsAmalfi")).toBeInTheDocument();
    });
  });
});