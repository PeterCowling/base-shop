import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

const BASE_TRANSLATIONS = {
  "content.bestTimeToVisit.seo.title": "Best time to visit",
  "content.bestTimeToVisit.seo.description": "Seasons",
  "labels.homeBreadcrumb": "Home",
  "labels.guidesBreadcrumb": "Guides",
} as const;

describe("Best time to visit Positano guide", () => {
  it("uses English schema month fallbacks when localized data is empty", async () => {
    await withGuideMocks("bestTimeToVisit", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("es", "guides", {
        ...BASE_TRANSLATIONS,
        "breadcrumbs.home": "Inicio",
        "breadcrumbs.guides": "Guías",
        "content.bestTimeToVisit.schemaMonths": [],
      });

      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.bestTimeToVisit.schemaMonths": [
          { name: "May", note: "Warm and quiet" },
          { name: "September", note: "Great swimming" },
        ],
      });

      await renderRoute({ lang: "es" });

      expect(screen.getByTestId("generic-bestTimeToVisit")).toBeInTheDocument();
    });
  });
});