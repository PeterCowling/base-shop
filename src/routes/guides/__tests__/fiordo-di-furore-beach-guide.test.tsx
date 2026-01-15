// src/routes/guides/__tests__/fiordo-di-furore-beach-guide.test.tsx
import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { genericContentMock } from "./guides.test-utils";

describe("fiordo di furore beach guide", () => {
  it("prefers localized structured content when available", async () => {
    await withGuideMocks(
      "fiordoDiFuroreBeachGuide",
      async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("fr", "guides", {
        "content.fiordoDiFuroreBeachGuide.seo.title": "Fiordo di Furore",
        "content.fiordoDiFuroreBeachGuide.seo.description": "Plan a perfect swim",
        "content.fiordoDiFuroreBeachGuide.intro": ["Intro FR"],
        "content.fiordoDiFuroreBeachGuide.sections": [{ id: "how-to", title: "Comment", body: ["Step"] }],
        "content.fiordoDiFuroreBeachGuide.faqs": [{ q: "Quand?", a: ["Été"] }],
        "breadcrumbs.home": "Accueil",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({ lang: "fr" });

      await expect(
        screen.findByRole("heading", { level: 1, name: /Fiordo di Furore/i }),
      ).resolves.toBeInTheDocument();

      const article = screen.getByTestId("article-structured");
      expect(article).toHaveAttribute("data-headline", "Fiordo di Furore");
      const breadcrumbJson = screen.getByTestId("breadcrumb-structured").textContent ?? "";
      expect(breadcrumbJson).toContain("Accueil");
      expect(breadcrumbJson).toContain("Guides");
      expect(genericContentMock).toHaveBeenCalledWith(
        expect.objectContaining({ guideKey: "fiordoDiFuroreBeachGuide" }),
      );
    });
  });

  it("falls back to English structured content when locale arrays are empty", async () => {
    await withGuideMocks("fiordoDiFuroreBeachGuide", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("fr", "guides", {
        "content.fiordoDiFuroreBeachGuide.seo.title": "Fiordo locale",
        "content.fiordoDiFuroreBeachGuide.seo.description": "Description locale",
        "content.fiordoDiFuroreBeachGuide.intro": [],
        "content.fiordoDiFuroreBeachGuide.sections": [],
        "content.fiordoDiFuroreBeachGuide.faqs": [],
        "breadcrumbs.home": "",
        "breadcrumbs.guides": "",
      });

      setTranslations("en", "guides", {
        "content.fiordoDiFuroreBeachGuide.intro": ["English intro"],
        "content.fiordoDiFuroreBeachGuide.sections": [{ id: "english", title: "English", body: ["Body"] }],
        "content.fiordoDiFuroreBeachGuide.faqs": [{ q: "When?", a: ["Summer"] }],
        "breadcrumbs.home": "Home",
        "breadcrumbs.guides": "Guides",
      });

      await renderRoute({ lang: "fr" });

      const breadcrumbJson = screen.getByTestId("breadcrumb-structured").textContent ?? "";
      expect(breadcrumbJson).toContain("Home");
      expect(breadcrumbJson).toContain("Guides");

      const genericCall = genericContentMock.mock.calls.at(-1)?.[0];
      expect(genericCall?.guideKey).toBe("fiordoDiFuroreBeachGuide");
      const translator = genericCall?.t as ((key: string, options?: Record<string, unknown>) => unknown) | undefined;
      expect(
        translator?.("content.fiordoDiFuroreBeachGuide.intro", { returnObjects: true }),
      ).toEqual(["English intro"]);
    });
  });
});