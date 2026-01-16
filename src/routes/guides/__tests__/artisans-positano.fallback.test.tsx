import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";

const BASE_TRANSLATIONS = {
  "content.artisansPositanoShopping.seo.title": "Artisans in Positano",
  "content.artisansPositanoShopping.seo.description": "Where to shop",
  "labels.homeBreadcrumb": "Home",
  "labels.guidesBreadcrumb": "Guides",
} as const;

describe("Art and artisans Positano shopping guide", () => {
  it("uses English structured content when the current language lacks data", async () => {
    await withGuideMocks("artisansPositanoShopping", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("it", "guides", {
        ...BASE_TRANSLATIONS,
        "content.artisansPositanoShopping.intro": [],
        "content.artisansPositanoShopping.sections": [],
        "content.artisansPositanoShopping.faqs": [],
      });

      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.artisansPositanoShopping.intro": ["English intro"],
        "content.artisansPositanoShopping.sections": [
          { id: "shops", title: "Shops", body: ["Visit local artisans"] },
        ],
        "content.artisansPositanoShopping.faqs": [{ q: "Do they ship?", a: ["Yes"] }],
      });

      await renderRoute({ lang: "it" });

      expect(screen.getByTestId("generic-artisansPositanoShopping")).toBeInTheDocument();
    });
  });

  it("renders nothing when neither language provides structured content", async () => {
    await withGuideMocks("artisansPositanoShopping", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        ...BASE_TRANSLATIONS,
        "content.artisansPositanoShopping.intro": [],
        "content.artisansPositanoShopping.sections": [],
        "content.artisansPositanoShopping.faqs": [],
      });

      await renderRoute({ lang: "en" });

      expect(screen.queryByTestId("generic-artisansPositanoShopping")).toBeNull();
    });
  });
});