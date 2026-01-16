import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

const BREADCRUMB_ID = "breadcrumb-structured";

const readBreadcrumb = (screen: typeof import("@testing-library/dom").screen) => {
  const raw = screen.getByTestId(BREADCRUMB_ID).textContent ?? "{}";
  return JSON.parse(raw) as {
    itemListElement?: Array<{ name?: string; item?: string }>;
  };
};

describe("ravello travel guide route", () => {
  it("renders localized content when sections exist", async () => {
    await withGuideMocks("ravelloGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.ravelloGuide.title": "Ravello travel guide",
        "guides.meta.ravelloGuide.description": "Plan a trip to the hilltop town.",
        "content.ravelloGuide.seo.title": "Ravello travel guide",
        "content.ravelloGuide.seo.description": "Plan a trip to the hilltop town.",
        "content.ravelloGuide.intro": ["Start with the Villa Rufolo gardens."],
        "content.ravelloGuide.sections": [
          { id: "overview", title: "Overview", body: ["Ravello sits above Amalfi."] },
        ],
        "labels.homeBreadcrumb": "Home",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({ lang: "en", harness: { syntheticToc: "off" } });

      const heading = await screen.findByRole("heading", { level: 1 });
      expect(heading.textContent ?? "").toContain("Ravello travel guide");
      const breadcrumb = readBreadcrumb(screen);
      expect((breadcrumb.itemListElement ?? []).map((item) => item?.name)).toEqual([
        "Home",
        "Guides",
        "Ravello travel guide",
      ]);
      expect(screen.queryByTestId("toc")).toBeNull();
      expect(screen.getByTestId("generic-ravelloGuide")).toBeInTheDocument();
    });
  });

  it("normalises fallback data when localized arrays are empty", async () => {
    await withGuideMocks("ravelloGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "guides.meta.ravelloGuide.title": "Ravello travel guide",
        "guides.meta.ravelloGuide.description": "Plan a trip to the hilltop town.",
        "content.ravelloGuide.fallback.toc": [
          { href: "#backup", label: "Backup" },
        ],
        "content.ravelloGuide.fallback.sections": {
          backup: {
            heading: "Backup section",
            body: ["Additional guidance."],
          },
        },
      });

      setTranslations("en", "guidesFallback", {
        "ravelloGuide.toc": [{ href: "#fallback", label: "Fallback" }],
        "ravelloGuide.sections": [
          { id: "fallback", title: "Fallback", body: ["Fallback body."] },
        ],
      });

      setTranslations("it", "guides", {
        "guides.meta.ravelloGuide.title": "Guida di Ravello",
        "guides.meta.ravelloGuide.description": "Pianifica il viaggio nel borgo.",
        "content.ravelloGuide.seo.title": "Guida di Ravello",
        "content.ravelloGuide.seo.description": "Pianifica il viaggio nel borgo.",
        "content.ravelloGuide.intro": [],
        "content.ravelloGuide.sections": [],
        "content.ravelloGuide.fallback": {
          toc: [
            { href: "  #piazza  ", label: "  Piazza Duomo  " },
            { href: 5, label: "" },
          ],
          sections: [
            { id: " piazza ", title: " Piazza Duomo ", body: ["  Passeggia al tramonto  "] },
            { id: "", title: "Ignora", body: [] },
          ],
        },
        "labels.homeBreadcrumb": "Casa",
        "labels.guidesBreadcrumb": "Guide",
        "breadcrumbs.home": "Casa",
        "breadcrumbs.guides": "Guide",
      });

      await renderRoute({ lang: "it" });

      const toc = screen.getByTestId("toc");
      const items = Array.from(toc.querySelectorAll("li")).map((li) => li.textContent?.trim());
      expect(items).toEqual(["Piazza Duomo"]);
      expect(screen.getByText("Passeggia al tramonto")).toBeInTheDocument();
    });
  });

  it("prefers English fallback when localized fallback is empty", async () => {
    await withGuideMocks("ravelloGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.ravelloGuide.fallback": {
          toc: [{ href: "#backup", label: "Backup" }],
          sections: {
            backup: {
              heading: "Backup section",
              body: ["Fallback paragraph."],
            },
          },
        },
      });

      setTranslations("en", "guidesFallback", {
        "ravelloGuide.toc": [],
        "ravelloGuide.sections": [],
      });

      setTranslations("fr", "guides", {
        "guides.meta.ravelloGuide.title": "Guide de Ravello",
        "guides.meta.ravelloGuide.description": "Préparez votre visite sur les hauteurs.",
        "content.ravelloGuide.seo.title": "Guide de Ravello",
        "content.ravelloGuide.seo.description": "Préparez votre visite sur les hauteurs.",
        "content.ravelloGuide.intro": [],
        "content.ravelloGuide.sections": [],
        "content.ravelloGuide.fallback": { toc: [], sections: [] },
        "labels.homeBreadcrumb": "Accueil",
        "labels.guidesBreadcrumb": "Guides",
        "breadcrumbs.home": "Accueil",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({ lang: "fr", harness: { syntheticToc: "off" } });

      expect(screen.queryByTestId("toc")).toBeNull();
      expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
    });
  });

  it("handles null fallback data gracefully", async () => {
    await withGuideMocks("ravelloGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.ravelloGuide.fallback": null,
      });

      setTranslations("de", "guides", {
        "guides.meta.ravelloGuide.title": "Reiseführer Ravello",
        "guides.meta.ravelloGuide.description": "Planen Sie Ihren Besuch in der Höhe.",
        "content.ravelloGuide.seo.title": "Reiseführer Ravello",
        "content.ravelloGuide.seo.description": "Planen Sie Ihren Besuch in der Höhe.",
        "content.ravelloGuide.intro": [],
        "content.ravelloGuide.sections": [],
        "content.ravelloGuide.fallback": null,
      });

      await renderRoute({ lang: "de", harness: { syntheticToc: "off" } });

      expect(screen.queryByTestId("toc")).toBeNull();
      expect(screen.queryAllByRole("heading", { level: 2 })).toHaveLength(0);
    });
  });
});