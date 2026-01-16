import { describe, expect, it } from "vitest";

import { findJsonLdByType } from "@tests/jsonld";

import { withGuideMocks } from "./guideTestHarness";

describe("Backpacking Southern Italy itinerary — route coverage", () => {
  it("renders English structured content and breadcrumb schema", async () => {
    await withGuideMocks("backpackingSouthernItaly", async ({ renderRoute, screen }) => {
      await renderRoute({
        lang: "en",
        route: "/en/guides/backpacking-southern-italy-itinerary",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /backpacking southern italy/i }),
      ).resolves.toBeInTheDocument();
      await expect(screen.findByText(/plan a loop through southern italy/i)).resolves.toBeInTheDocument();

      const breadcrumb = findJsonLdByType("BreadcrumbList") as {
        itemListElement?: { name?: string; item?: string }[];
      } | undefined;
      expect(breadcrumb?.itemListElement?.[0]?.name).toBe("Home");
      expect(breadcrumb?.itemListElement?.[1]?.item).toContain("/en/guides");
    });
  });

  it("falls back to English content and safe labels when locale arrays are empty", async () => {
    await withGuideMocks("backpackingSouthernItaly", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "labels.homeBreadcrumb": " ",
        "labels.guidesBreadcrumb": " ",
      });

      setTranslations("it", "guides", {
        "content.backpackingSouthernItaly.intro": [],
        "content.backpackingSouthernItaly.sections": [],
        "content.backpackingSouthernItaly.faqs": [],
        "labels.homeBreadcrumb": " ",
        "labels.guidesBreadcrumb": " ",
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/backpacking-southern-italy-itinerary",
      });

      await expect(screen.findByText(/Plan a loop through southern Italy/i)).resolves.toBeInTheDocument();

      const breadcrumb = findJsonLdByType("BreadcrumbList") as {
        itemListElement?: { name?: string }[];
      } | undefined;
      expect(breadcrumb?.itemListElement?.[0]?.name).toBe("Home");
      expect(breadcrumb?.itemListElement?.[1]?.name).toBe("Guides");
    });
  });
});