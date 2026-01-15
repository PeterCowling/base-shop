import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("cheap-eats-in-positano route", () => {
  it("renders localized content when translations are provided", async () => {
    await withGuideMocks("cheapEats", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.cheapEats.seo.title": "Cibo economico a Positano",
        "content.cheapEats.seo.description": "Dove mangiare spendendo poco",
        "content.cheapEats.intro": ["Mangia bene senza spendere troppo."],
        "content.cheapEats.sections": [
          {
            id: "spuntini",
            title: "Spuntini veloci",
            body: ["Prendi panini e pizza al taglio prima di mezzogiorno."],
          },
        ],
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/cheap-eats-in-positano",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /cibo economico a positano/i }),
      ).resolves.toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: /spuntini veloci/i })).toBeInTheDocument();
      expect(screen.getByText(/panini e pizza al taglio/i)).toBeInTheDocument();
    });
  });

  it("falls back to English structured content when locale arrays are empty", async () => {
    await withGuideMocks("cheapEats", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("fr", "guides", {
        "content.cheapEats.intro": [],
        "content.cheapEats.sections": [],
        "content.cheapEats.faqs": [],
      });

      await renderRoute({
        lang: "fr",
        route: "/fr/guides/cheap-eats-in-positano",
      });

      await expect(
        screen.findByRole("heading", { level: 2, name: /grab-and-go staples/i }),
      ).resolves.toBeInTheDocument();
      expect(screen.getByText(/pizza al taglio/i)).toBeInTheDocument();
    });
  });
});