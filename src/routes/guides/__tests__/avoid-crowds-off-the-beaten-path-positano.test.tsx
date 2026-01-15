import { describe, it, expect } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

describe("avoid crowds Positano guide", () => {
  it("renders localized content when translations are provided", async () => {
    await withGuideMocks("avoidCrowdsPositano", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        "content.avoidCrowdsPositano.seo.title": "Evita la folla",
        "content.avoidCrowdsPositano.seo.description": "Scopri sentieri tranquilli",
        "content.avoidCrowdsPositano.intro": ["Benvenutə a Positano senza folla"],
      });

      await renderRoute({ lang: "it", route: "/it/guides/avoid-crowds-off-the-beaten-path-positano" });

      await expect(
        screen.findByRole("heading", { level: 1, name: /evita la folla/i }),
      ).resolves.toBeInTheDocument();
      expect(screen.getByTestId("article-structured")).toHaveTextContent("Evita la folla");
    });
  });

  it("renders gracefully for Spanish when structured content is empty", async () => {
    await withGuideMocks("avoidCrowdsPositano", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("es", "guides", {
        "content.avoidCrowdsPositano.seo.title": "Evita multitudes",
        "content.avoidCrowdsPositano.seo.description": "Descubre Positano tranquilo",
        "content.avoidCrowdsPositano.intro": [],
        "content.avoidCrowdsPositano.sections": [],
        "content.avoidCrowdsPositano.faqs": [],
      });

      setTranslations("en", "guides", {
        "content.avoidCrowdsPositano.intro": ["English intro"],
      });

      await renderRoute({ lang: "es", route: "/es/guides/avoid-crowds-off-the-beaten-path-positano" });

      await expect(
        screen.findByRole("heading", { level: 1, name: /evita multitudes/i }),
      ).resolves.toBeInTheDocument();
      expect(screen.getByTestId("article-structured")).toHaveTextContent("Evita multitudes");
    });
  });

  it("does not inject English fallback content for Russian locales", async () => {
    await withGuideMocks("avoidCrowdsPositano", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("ru", "guides", {
        "content.avoidCrowdsPositano.seo.title": "Избежать толп",
        "content.avoidCrowdsPositano.seo.description": "Спокойные маршруты по Позитано",
        "content.avoidCrowdsPositano.intro": [],
        "content.avoidCrowdsPositano.sections": [],
        "content.avoidCrowdsPositano.faqs": [],
      });

      setTranslations("en", "guides", {
        "content.avoidCrowdsPositano.intro": ["English intro"],
      });

      await renderRoute({ lang: "ru", route: "/ru/guides/avoid-crowds-off-the-beaten-path-positano" });

      await expect(
        screen.findByRole("heading", { level: 1, name: /избежать толп/i }),
      ).resolves.toBeInTheDocument();
      expect(screen.queryByText("English intro")).toBeNull();
      expect(screen.getByTestId("article-structured")).toHaveTextContent("Избежать толп");
    });
  });
});