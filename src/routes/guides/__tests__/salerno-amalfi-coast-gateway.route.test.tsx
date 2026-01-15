import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("salerno amalfi coast gateway route", () => {
  it("renders structured content when locale bundles are populated", async () => {
    await withGuideMocks("salernoGatewayGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.salernoGatewayGuide.title": "Salerno gateway guide",
        "guides.meta.salernoGatewayGuide.description": "Use Salerno as an access hub.",
        "content.salernoGatewayGuide.seo.title": "Salerno gateway guide",
        "content.salernoGatewayGuide.seo.description": "Use Salerno as an access hub.",
        "content.salernoGatewayGuide.intro": ["Salerno is the best interchange for rail arrivals."],
        "content.salernoGatewayGuide.sections": [
          { id: "plan", title: "Plan ahead", body: ["Buy ferry tickets at the pier."] },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({ lang: "en", harness: { syntheticToc: "off" } });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Salerno gateway guide");
      expect(screen.getByTestId("generic-salernoGatewayGuide")).toBeInTheDocument();
      expect(screen.queryByTestId("toc")).toBeNull();
    });
  });

  it("falls back to sanitized sections when localized arrays are empty", async () => {
    await withGuideMocks("salernoGatewayGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.salernoGatewayGuide.fallback.intro": ["Fallback intro", ""],
        "content.salernoGatewayGuide.fallback.sections": {
          trains: {
            heading: "Trains",
            body: ["Arrive at Salerno station."],
          },
        },
      });

      setTranslations("en", "guidesFallback", {
        "salernoGatewayGuide.sections": [
          { id: "ferries", title: "Ferries", body: ["Reserve coastal ferries in advance."] },
        ],
      });

      setTranslations("it", "guides", {
        "guides.meta.salernoGatewayGuide.title": "Guida a Salerno",
        "guides.meta.salernoGatewayGuide.description": "Usa Salerno come base di accesso.",
        "content.salernoGatewayGuide.seo.title": "Guida a Salerno",
        "content.salernoGatewayGuide.seo.description": "Usa Salerno come base di accesso.",
        "content.salernoGatewayGuide.intro": [],
        "content.salernoGatewayGuide.sections": [],
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
        "breadcrumbs.home": "Casa",
        "breadcrumbs.guides": "Guide",
      });

      await renderRoute({ lang: "it" });

      const toc = screen.getByTestId("toc");
      const labels = Array.from(toc.querySelectorAll("li")).map((li) => li.textContent?.trim());
      expect(labels).toContain("Ferries");
      expect(screen.getByText("Reserve coastal ferries in advance.")).toBeInTheDocument();
    });
  });

  it("omits ToC when fallback data is insufficient", async () => {
    await withGuideMocks("salernoGatewayGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.salernoGatewayGuide.fallback.sections": {
          ferries: { heading: "Ferries", body: ["Keep travelling."] },
        },
      });

      setTranslations("de", "guides", {
        "guides.meta.salernoGatewayGuide.title": "Gateway Salerno",
        "guides.meta.salernoGatewayGuide.description": "Nutzen Sie Salerno als Zugangspunkt.",
        "content.salernoGatewayGuide.seo.title": "Gateway Salerno",
        "content.salernoGatewayGuide.seo.description": "Nutzen Sie Salerno als Zugangspunkt.",
        "content.salernoGatewayGuide.intro": [],
        "content.salernoGatewayGuide.sections": [],
        "content.salernoGatewayGuide.fallback": {
          sections: [
            { id: "  ", title: "  ", body: [" Keep travelling  "] },
            { id: "valid", title: "   ", body: ["Trimmed"] },
          ],
        },
      });

      await renderRoute({ lang: "de", harness: { syntheticToc: "off" } });

      expect(screen.queryByTestId("toc")).toBeNull();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Gateway Salerno");
    });
  });

  it("renders paragraph blocks when fallback sections lose metadata", async () => {
    await withGuideMocks("salernoGatewayGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.salernoGatewayGuide.fallback.sections": {
          ferries: { heading: "Ferries", body: ["Next options"] },
        },
      });

      setTranslations("fr", "guides", {
        "guides.meta.salernoGatewayGuide.title": "Guide de Salerne",
        "guides.meta.salernoGatewayGuide.description": "Utilisez Salerne comme porte d'entrée.",
        "content.salernoGatewayGuide.seo.title": "Guide de Salerne",
        "content.salernoGatewayGuide.seo.description": "Utilisez Salerne comme porte d'entrée.",
        "content.salernoGatewayGuide.intro": [],
        "content.salernoGatewayGuide.sections": [],
        "content.salernoGatewayGuide.fallback": {
          sections: [
            { id: "", title: "", body: [" Trimmed paragraph "] },
            { id: "ferries", title: " Ferries ", body: [" Next options "] },
          ],
        },
      });

      await renderRoute({ lang: "fr" });

      expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent("Guide de Salerne");
      expect(screen.getByTestId("tag-chips")).toBeInTheDocument();
      expect(screen.getByText("Trimmed paragraph")).toBeInTheDocument();
      expect(screen.getByText("Next options")).toBeInTheDocument();
    });
  });
});