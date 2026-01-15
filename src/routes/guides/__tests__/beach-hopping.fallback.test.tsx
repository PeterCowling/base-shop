import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

const BASE_TRANSLATIONS = {
  "content.beachHoppingAmalfi.seo.title": "Beach hopping",
  "content.beachHoppingAmalfi.seo.description": "Best beaches",
  "labels.homeBreadcrumb": "Home",
  "labels.guidesBreadcrumb": "Guides",
} as const;

describe("Beach hopping guide fallback behaviour", () => {
  it("falls back to default breadcrumb labels when localized strings are blank", async () => {
    await withGuideMocks("beachHoppingAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "breadcrumbs.home": " ",
        "breadcrumbs.guides": "",
        "content.beachHoppingAmalfi.intro": ["Beach intro"],
        "content.beachHoppingAmalfi.sections": [
          { id: "overview", title: "Overview", body: ["Beach stops"] },
        ],
      });

      await renderRoute({ lang: "en" });

      expect(screen.getByTestId("generic-beachHoppingAmalfi")).toBeInTheDocument();
    });
  });
});