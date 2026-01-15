import { beforeEach, describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { resetGuideTestState } from "./guides.test-utils";

describe("local-legends-and-folklore-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTestState();
  });

  it("renders localized structured content when translations are present", async () => {
    await withGuideMocks("folkloreAmalfi", async ({ setTranslations, setCurrentLanguage, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "guides.meta.folkloreAmalfi.title": "Leggende amalfitane",
        "guides.meta.folkloreAmalfi.description": "Storie tramandate",
        "content.folkloreAmalfi.seo.title": "Leggende amalfitane",
        "content.folkloreAmalfi.seo.description": "Storie tramandate",
        "content.folkloreAmalfi.intro": ["Benvenuto tra miti e racconti."],
        "content.folkloreAmalfi.sections": [
          { id: "origini", title: "Origini", body: ["Le prime storie dei pescatori."] },
        ],
        "content.folkloreAmalfi.faqs": [{ q: "Qual è la leggenda più famosa?", a: ["La sirena Partenope."] }],
      });

      setCurrentLanguage("it");
      await renderRoute({ lang: "it" });

      expect(
        await screen.findByRole("heading", { level: 1, name: "Leggende amalfitane" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Benvenuto tra miti e racconti.")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Origini" })).toBeInTheDocument();
      expect(screen.getByText("Qual è la leggenda più famosa?")).toBeInTheDocument();
      expect(screen.queryByTestId("generic-folkloreAmalfi")).toBeNull();
    });
  });

  it("falls back to English folklore content when localized bundles are empty", async () => {
    await withGuideMocks("folkloreAmalfi", async ({ setTranslations, setCurrentLanguage, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.folkloreAmalfi.intro": [],
        "content.folkloreAmalfi.sections": [],
        "content.folkloreAmalfi.faqs": [],
      });

      setTranslations("en", "guidesFallback", {
        "folkloreAmalfi.intro": [
          "Mermaids, saints, and sailors — stories that color the Amalfi Coast and the places they reference today.",
        ],
        "folkloreAmalfi.sections": [
          {
            title: "Fishermen’s tales",
            body: ["Legends of protective saints and sudden sea changes explain local rituals and festivals."],
          },
        ],
      });

      setCurrentLanguage("it");
      await renderRoute({ lang: "it" });

      expect(
        await screen.findByText(
          "Mermaids, saints, and sailors — stories that color the Amalfi Coast and the places they reference today.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Fishermen’s tales" })).toBeInTheDocument();
    });
  });
});