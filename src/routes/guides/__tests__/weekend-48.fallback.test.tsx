import { describe, expect, it } from "vitest";
import { within } from "@testing-library/react";

import { capturedFaqFallbacks } from "./guides.test-utils";
import { withGuideMocks } from "./guideTestHarness";

const GUIDE_KEY = "weekend48Positano" as const;

const BASE_TRANSLATIONS = {
  "content.weekend48Positano.seo.title": "48-hour Positano weekend",
  "content.weekend48Positano.seo.description": "Two-day highlights",
} as const;

describe("48-hour Positano weekend guide", () => {
  it("derives a table of contents and sections from structured translations", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.weekend48Positano.intro": ["  Arrive early  ", "Book ferries"],
        "content.weekend48Positano.sections": [
          { id: "day-one", title: "Day one", body: ["Sunrise at the balcony"] },
          { id: "day-two", title: "Day two", body: ["Path of the Gods"] },
        ],
        "content.weekend48Positano.tips": ["Carry cash", "Reserve tables"],
        "content.weekend48Positano.faqs": [{ q: "Do I need tickets?", a: ["Yes, peak season"] }],
        "content.weekend48Positano.toc": [
          { href: "", label: "Overview" },
          { label: "Dining" },
        ],
        "content.weekend48Positano.tocTitle": "On this weekend",
        "content.weekend48Positano.tipsTitle": "Key tips",
        "content.weekend48Positano.faqsTitle": "Weekend FAQs",
      });

      await renderRoute({ lang: "en" });

      expect(screen.getAllByText("Arrive early").length).toBeGreaterThan(0);

      const toc = screen.getByTestId("toc");
      const tocEntries = Array.from(toc.querySelectorAll("li"), (node) => node.textContent ?? "");
      expect(tocEntries).toEqual(["Overview", "Dining", "Key tips", "Weekend FAQs"]);

      expect(screen.getAllByRole("heading", { level: 2, name: "Day one" }).length).toBeGreaterThan(0);
      expect(screen.getAllByText("Carry cash").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Do I need tickets?").length).toBeGreaterThan(0);

      capturedFaqFallbacks.delete(GUIDE_KEY);
    });
  });

  it("renders manual fallback sections when localized structured arrays are empty", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.weekend48Positano.intro": [],
        "content.weekend48Positano.sections": [],
        "content.weekend48Positano.tips": [],
        "content.weekend48Positano.faqs": [],
      });

      setTranslations("en", "guidesFallback", {
        content: {
          weekend48Positano: {
            intro: ["Fallback overview for the 48-hour stay"],
            sections: [
              {
                id: "fallback-day-one",
                title: "Fallback day one",
                body: ["Manual morning highlights"],
              },
              {
                id: "fallback-day-two",
                title: "Fallback day two",
                body: ["Manual sunset plan"],
              },
            ],
          },
        },
      });

      await renderRoute({ lang: "en" });

      expect(screen.getByText("Fallback overview for the 48-hour stay")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Fallback day one" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Fallback day two" })).toBeInTheDocument();

      const toc = screen.getByTestId("toc");
      const tocLabels = Array.from(toc.querySelectorAll("li")).map((node) => node.textContent?.trim());
      expect(tocLabels).toEqual(["Fallback day one", "Fallback day two"]);

      capturedFaqFallbacks.delete(GUIDE_KEY);
    });
  });

  it("derives table of contents entries from sections when translations omit them", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "labels.onThisPage": "",
        "labels.tipsHeading": "   ",
        "labels.faqsHeading": "   ",
        "content.weekend48Positano.intro": ["  Trim me  "],
        "content.weekend48Positano.sections": [
          { title: "Morning", body: ["Coffee at the piazza"] },
          { title: "Evening", body: ["Sunset cruise"] },
        ],
        "content.weekend48Positano.tips": ["Reserve dinner"],
        "content.weekend48Positano.faqs": [{ q: "Do ferries run late?", a: ["Until midnight"] }],
        "content.weekend48Positano.toc": [],
        "content.weekend48Positano.tocTitle": " ",
        "content.weekend48Positano.tipsTitle": " ",
        "content.weekend48Positano.faqsTitle": " ",
      });

      await renderRoute({ lang: "en" });

      const toc = screen.getByTestId("toc");
      const tocLinks = Array.from(toc.querySelectorAll("li"), (node) => node.textContent ?? "");
      expect(tocLinks).toEqual(["Morning", "Evening", "Tips", "FAQs"]);
      capturedFaqFallbacks.delete(GUIDE_KEY);
      expect(screen.getAllByText("Trim me").length).toBeGreaterThan(0);
      expect(screen.getAllByRole("heading", { level: 2, name: "Morning" }).length).toBeGreaterThan(0);
      expect(screen.getAllByText("Reserve dinner").length).toBeGreaterThan(0);

      capturedFaqFallbacks.delete(GUIDE_KEY);
    });
  });
});