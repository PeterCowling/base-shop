import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("porter-service-positano route", () => {
  it("renders the porter service guide via GenericContent with related guides", async () => {
    await withGuideMocks("porterServices", async ({ renderRoute, screen }) => {
      await renderRoute({
        lang: "en",
        route: "/en/guides/porter-service-positano",
      });

      const heading = await screen.findByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("porterServices");

      expect(screen.getByTestId("article-structured")).toHaveTextContent("porterServices");
      expect(screen.getByTestId("generic-porterServices")).toBeInTheDocument();

      const related = screen.getByTestId("related-guides").getAttribute("data-items") ?? "";
      expect(related).toContain("ferryDockToBrikette");
      expect(related).toContain("chiesaNuovaArrivals");
    });
  });

  it("falls back to English content when locale arrays are empty", async () => {
    await withGuideMocks("porterServices", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("fr", "guides", {
        "content.porterServices.intro": [],
        "content.porterServices.sections": [],
        "content.porterServices.steps": [],
        "content.porterServices.resources": [],
        "content.porterServices.etiquette": [],
        "content.porterServices.faqs": [],
      });

      await renderRoute({
        lang: "fr",
        route: "/fr/guides/porter-service-positano",
      });

      const heading = await screen.findByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("porterServices");

      expect(screen.getByTestId("generic-porterServices")).toBeInTheDocument();
      expect(screen.getByTestId("related-guides")).toBeInTheDocument();
    });
  });
});