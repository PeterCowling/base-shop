import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { capturedFaqFallbacks } from "./guides.test-utils";

describe("Backpacking Southern Italy itinerary — fallbacks", () => {
  it("falls back to English content when the locale arrays are empty", async () => {
    await withGuideMocks("backpackingSouthernItaly", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("de", "guides", {
        "content.backpackingSouthernItaly.seo.title": "Backpacking Süditalien",
        "content.backpackingSouthernItaly.seo.description": "Routen",
        "content.backpackingSouthernItaly.intro": [],
        "content.backpackingSouthernItaly.sections": [],
        "content.backpackingSouthernItaly.faqs": [],
      });

      setTranslations("en", "guides", {
        "content.backpackingSouthernItaly.faqs": [
          { q: "Is transport frequent?", a: ["Yes"] },
        ],
      });

      await renderRoute({
        lang: "de",
        route: "/de/guides/backpacking-southern-italy-itinerary",
      });

      await expect(screen.findByRole("heading", { level: 1 })).resolves.toBeInTheDocument();
      expect(screen.getByTestId("faq-json-backpackingSouthernItaly")).toBeInTheDocument();

      const fallback = capturedFaqFallbacks.get("backpackingSouthernItaly");
      expect(fallback?.("de")).toEqual([{ q: "Is transport frequent?", a: ["Yes"] }]);
    });
  });

  it("renders localized content when translations are supplied", async () => {
    await withGuideMocks("backpackingSouthernItaly", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.backpackingSouthernItaly.seo.title": "Itinerario zaino in spalla",
        "content.backpackingSouthernItaly.seo.description": "Pianifica il tuo viaggio",
        "content.backpackingSouthernItaly.intro": ["Benvenuto"],
        "content.backpackingSouthernItaly.sections": [
          { id: "giorno1", title: "Giorno 1", body: ["Arrivo a Napoli"] },
        ],
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/backpacking-southern-italy-itinerary",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /itinerario zaino in spalla/i }),
      ).resolves.toBeInTheDocument();
      expect(screen.getByTestId("generic-backpackingSouthernItaly")).toBeInTheDocument();
    });
  });
});