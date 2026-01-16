import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("amalfi-coast-public-transport-guide", () => {
  it("surfaces localized metadata when translations are provided", async () => {
    await withGuideMocks("publicTransportAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.publicTransportAmalfi.seo.title": "Trasporti Amalfi",
        "content.publicTransportAmalfi.seo.description": "Muoviti senza auto",
        "content.publicTransportAmalfi.intro": ["Intro principale"],
        "content.publicTransportAmalfi.sections": [
          { id: "bus", title: "Bus SITA", body: ["Parte da Positano"] },
        ],
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/amalfi-coast-public-transport-guide",
      });

      await expect(
        screen.findByRole("heading", { level: 1, name: /trasporti amalfi/i }),
      ).resolves.toBeInTheDocument();
      const structuredArticleNode = screen.getByTestId("article-structured");
      expect(structuredArticleNode).toHaveAttribute("data-description", "Muoviti senza auto");
      expect(structuredArticleNode).toHaveAttribute("data-headline", "Trasporti Amalfi");
      const breadcrumbNode = screen.getByTestId("breadcrumb-structured");
      expect(breadcrumbNode.getAttribute("data-breadcrumb")).toContain("\"Trasporti Amalfi\"");
      expect(breadcrumbNode.getAttribute("data-breadcrumb")).toContain("\"Guides\"");
    });
  });

  it("falls back to English structured content when locale arrays are empty", async () => {
    await withGuideMocks("publicTransportAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.publicTransportAmalfi.seo.title": "Trasporti Amalfi",
        "content.publicTransportAmalfi.seo.description": "Muoviti senza auto",
        "content.publicTransportAmalfi.intro": [],
        "content.publicTransportAmalfi.sections": [],
        "content.publicTransportAmalfi.faqs": [],
      });

      await renderRoute({
        lang: "it",
        route: "/it/guides/amalfi-coast-public-transport-guide",
      });

      await expect(screen.findByRole("heading", { level: 1 })).resolves.toBeInTheDocument();
      expect(screen.getByTestId("faq-json-publicTransportAmalfi")).toBeInTheDocument();
    });
  });
});