import { describe, it, expect } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { genericContentMock } from "./guides.test-utils";

describe("Ischia and Procida guide", () => {
  it("renders localized content when sections exist", async () => {
    await withGuideMocks("ischiaProcidaGuide", async (ctx) => {
      const { setTranslations, renderRoute, setCurrentLanguage, screen } = ctx;

      setCurrentLanguage("it");

      setTranslations("it", "header", { home: "Casa" });
      setTranslations("it", "guides", {
        "labels.indexTitle": "Guide",
        "content.ischiaProcidaGuide.seo.title": "Ischia e Procida",
        "content.ischiaProcidaGuide.seo.description": "Consigli per escursioni",
        "content.ischiaProcidaGuide.intro": ["Introduzione"],
        "content.ischiaProcidaGuide.sections": [[{ type: "paragraph", value: "Body" }]],
      });

      const { getByTestId } = await renderRoute({ lang: "it" });

      expect(screen.getByRole("heading", { level: 1, name: "Ischia e Procida" })).toBeInTheDocument();
      expect(getByTestId("article-structured")).toHaveTextContent("Ischia e Procida");

      const lastCall = genericContentMock.mock.calls.at(-1)?.[0];
      expect(lastCall).toMatchObject({ guideKey: "ischiaProcidaGuide" });
      const translator = lastCall?.t as
        | ((key: string, options?: { returnObjects?: boolean; defaultValue?: unknown }) => unknown)
        | undefined;
      expect(translator?.("content.ischiaProcidaGuide.intro", { returnObjects: true })).toEqual([
        "Introduzione",
      ]);
    });
  });

  it("falls back to English structured content when sections are empty", async () => {
    await withGuideMocks("ischiaProcidaGuide", async (ctx) => {
      const { setTranslations, renderRoute, setCurrentLanguage } = ctx;

      setCurrentLanguage("it");

      setTranslations("it", "header", { home: "Casa" });
      setTranslations("it", "guides", {
        "labels.indexTitle": "Guide",
        "content.ischiaProcidaGuide.seo.title": "Ischia e Procida",
        "content.ischiaProcidaGuide.seo.description": "Consigli per escursioni",
        "content.ischiaProcidaGuide.intro": [],
        "content.ischiaProcidaGuide.sections": [],
      });

      setTranslations("en", "guides", {
        "labels.indexTitle": "Guides",
        "content.ischiaProcidaGuide.intro": ["English intro"],
        "content.ischiaProcidaGuide.sections": [[{ type: "paragraph", value: "English body" }]],
      });

      await renderRoute({ lang: "it" });

      const lastCall = genericContentMock.mock.calls.at(-1)?.[0];
      const translator = lastCall?.t as
        | ((key: string, options?: { returnObjects?: boolean; defaultValue?: unknown }) => unknown)
        | undefined;
      expect(translator?.("content.ischiaProcidaGuide.intro", { returnObjects: true })).toEqual([
        "English intro",
      ]);
    });
  });

  it("normalises breadcrumb labels with graceful fallbacks", async () => {
    await withGuideMocks("ischiaProcidaGuide", async (ctx) => {
      const { setTranslations, renderRoute, setCurrentLanguage, screen } = ctx;

      setCurrentLanguage("it");

      setTranslations("it", "header", { home: "   " });
      setTranslations("it", "guides", {
        "labels.indexTitle": "",
        "content.ischiaProcidaGuide.seo.title": "Ischia e Procida",
        "content.ischiaProcidaGuide.seo.description": "Consigli per escursioni",
        "content.ischiaProcidaGuide.intro": ["Intro"],
        "content.ischiaProcidaGuide.sections": [],
      });

      setTranslations("en", "header", { home: "Home" });
      setTranslations("en", "guides", {
        "labels.indexTitle": "Guides",
      });

      const { getByTestId } = await renderRoute({ lang: "it" });

      const breadcrumbRaw = getByTestId("breadcrumb-structured").getAttribute("data-breadcrumb");
      expect(breadcrumbRaw).toBeTruthy();
      const breadcrumb = JSON.parse(String(breadcrumbRaw)) as {
        itemListElement: Array<{ name: string }>;
      };
      expect(breadcrumb.itemListElement[0]?.name).toBe("Home");
      expect(breadcrumb.itemListElement[1]?.name).toBe("Guides");

      expect(screen.getByRole("heading", { level: 1, name: "Ischia e Procida" })).toBeInTheDocument();
    });
  });
});