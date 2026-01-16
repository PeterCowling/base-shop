import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("ferry-cancellations-weather route", () => {
  it("renders localized structured content with transport notice", async () => {
    await withGuideMocks("ferryCancellations", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.ferryCancellations.seo.title": "Cancellazioni dei traghetti e mare mosso",
        "content.ferryCancellations.seo.description": "Come gestire gli stop dei traghetti",
        "content.ferryCancellations.intro": ["Il mare mosso può fermare i traghetti con poco preavviso."],
        "content.ferryCancellations.sections": [
          {
            id: "aggiornamenti",
            title: "Segui gli aggiornamenti",
            body: ["Controlla i siti degli operatori e i canali Telegram locali ogni 30 minuti."],
          },
        ],
        "content.ferryCancellations.faqs": [
          { q: "Quando riprendono i viaggi?", a: ["Controlla gli annunci al porto."] },
        ],
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/ferry-cancellations-weather",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /cancellazioni dei traghetti/i }),
      ).resolves.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: /segui gli aggiornamenti/i })).toBeInTheDocument();
      expect(screen.getByText(/telegram locali/i)).toBeInTheDocument();
      expect(screen.getByText(/notice/i)).toBeInTheDocument(); // transport notice widget
    });
  });

  it("falls back to English FAQ answers when locale content is empty", async () => {
    await withGuideMocks("ferryCancellations", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("fr", "guides", {
        "content.ferryCancellations.intro": [],
        "content.ferryCancellations.sections": [],
        "content.ferryCancellations.faqs": [],
      });

      await renderRoute({
        lang: "fr",
        route: "/fr/guides/ferry-cancellations-weather",
      });

      const englishHeadings = await screen.findAllByRole("heading", {
        level: 1,
        name: /ferry cancellations and rough seas/i,
      });
      expect(englishHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText(/how do i know when sailings resume/i)).toBeInTheDocument();
    });
  });
});