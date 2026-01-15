import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { setTranslations } from "./guides.test-utils";

describe("positano winter budget guide", () => {
  it("renders GenericContent with localized metadata for winter coverage", async () => {
    await withGuideMocks("positanoWinterBudget", async ({ renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.positanoWinterBudget.title": "Positano on a winter budget",
        "guides.meta.positanoWinterBudget.description": "Plan a thrifty off-season stay.",
        "content.positanoWinterBudget.seo.title": "Positano on a winter budget",
        "content.positanoWinterBudget.seo.description": "Plan a thrifty off-season stay.",
        "content.positanoWinterBudget.intro": ["Embrace the quiet months with cosy stays."],
        "content.positanoWinterBudget.sections": [
          {
            title: "Accommodation discounts",
            body: ["Most guesthouses reduce nightly rates by 30% in January."],
          },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/positano-in-winter-on-a-budget",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /positano on a winter budget/i }),
      ).resolves.toBeInTheDocument();

      expect(screen.getByTestId("generic-positanoWinterBudget")).toBeInTheDocument();
    });
  });
});