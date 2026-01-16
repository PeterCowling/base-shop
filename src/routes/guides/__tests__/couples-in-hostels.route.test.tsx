import { describe, expect, it } from "vitest";
import { expectRouteHeadBasics } from "@tests/head";

import { withGuideMocks } from "./guideTestHarness";

describe("Couples in hostels guide", () => {
  it("renders localized structured content and registers FAQ fallbacks", async () => {
    await withGuideMocks("couplesInHostels", async ({ setTranslations, setCurrentLanguage, renderRoute, screen }) => {
      setTranslations("pt", "guides", {
        "guides.meta.couplesInHostels.title": "Viajar em casal em hostels",
        "guides.meta.couplesInHostels.description": "Planejem juntos a estadia em hostels.",
        "content.couplesInHostels.seo.title": "Viajar em casal em hostels",
        "content.couplesInHostels.seo.description": "Planejem juntos a estadia em hostels.",
        "content.couplesInHostels.intro": ["Planejem juntos"],
        "content.couplesInHostels.sections": [
          { id: "dorms", title: "Dormitórios", body: ["Combinar horários"] },
        ],
        "content.couplesInHostels.faqs": [{ q: "Privacidade?", a: ["Escolham suíte."] }],
      });

      setCurrentLanguage("pt");
      await renderRoute({ lang: "pt" });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Viajar em casal em hostels");
      expect(screen.getByTestId("generic-couplesInHostels")).toBeInTheDocument();
      expect(screen.getByTestId("faq-json-couplesInHostels")).toBeInTheDocument();
    });
  });

  it("synthesizes fallback sections when localized bundles are empty", async () => {
    await withGuideMocks("couplesInHostels", async ({ setTranslations, setCurrentLanguage, renderRoute, screen }) => {
      setTranslations("sv", "guides", {
        "content.couplesInHostels.intro": [],
        "content.couplesInHostels.sections": [],
        "content.couplesInHostels.faqs": [],
      });

      setCurrentLanguage("sv");
      await renderRoute({ lang: "sv" });

      expect(screen.queryByTestId("generic-couplesInHostels")).toBeNull();

      const articles = screen.getAllByRole("article");
      const articleParagraphs = articles.flatMap((article) => Array.from(article.querySelectorAll("p")));
      const informativeParagraphs = Array.from(articleParagraphs)
        .map((node) => node.textContent?.trim() ?? "")
        .filter((text) => text.length > 0);
      expect(informativeParagraphs.length).toBeLessThanOrEqual(1);
    });
  });

  it("emits article metadata for the default locale", async () => {
    await withGuideMocks("couplesInHostels", async ({ renderRoute }) => {
      await renderRoute({ lang: "en" });
      expectRouteHeadBasics({ expectArticle: true });
    });
  });
});