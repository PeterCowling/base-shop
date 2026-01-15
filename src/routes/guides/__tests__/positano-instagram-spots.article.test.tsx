import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("positano-instagram-spots route", () => {
  it("renders the Instagram guide fallback article when localized blocks exist", async () => {
    await withGuideMocks("instagramSpots", async ({ renderRoute, screen }) => {
      await renderRoute({
        lang: "en",
        route: "/en/guides/positano-instagram-spots",
      });

      expect(screen.queryByTestId("generic-instagramSpots")).not.toBeInTheDocument();
      expect(screen.getAllByTestId("image-gallery").length).toBeGreaterThan(0);
      expect(screen.getByTestId("article-structured")).toHaveTextContent("instagramSpots");
    });
  });

  it("falls back to the translated scaffold when localized content is missing", async () => {
    await withGuideMocks("instagramSpots", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("es", "guides", {
        "content.instagramSpots.intro": [],
        "content.instagramSpots.sections": [],
        "content.instagramSpots.fallback": {},
      });

      await renderRoute({
        lang: "es",
        route: "/es/guides/positano-instagram-spots",
      });

      // Fallback article still surfaces the gallery/content sections without relying on localized strings.
      expect(screen.getAllByTestId("image-gallery").length).toBeGreaterThan(0);
      expect(screen.queryByTestId("generic-instagramSpots")).not.toBeInTheDocument();
    });
  });
});