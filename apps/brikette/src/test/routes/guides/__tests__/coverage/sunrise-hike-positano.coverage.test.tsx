
import "@testing-library/jest-dom";

import { withGuideMocks } from "@/routes/guides/__tests__/guideTestHarness";

import { createTranslator } from "../guides.test-utils";

const ENGLISH_INTRO = [
  "Head out before dawn to catch the first light over the Amalfi Coast from a quiet vantage point above Positano.",
  "This walk starts at Hostel Brikette and takes around 25 minutes including the stair climb to the viewpoint.",
];

const ENGLISH_SECTION = {
  id: "overview",
  title: "What is the sunrise hike?",
  body: [
    "If you prefer to stay put, you can watch the sunrise from the hostel terrace as it rises to the left of the building.",
    "For a wider panorama, follow this short hike to a nearby cliff where you can watch the sun clear the horizon and light up the town below.",
  ],
};

describe("sunrise hike guide coverage", () => {
  it("uses fallback structured content when the active locale has no copy", async () => {
    await withGuideMocks("sunriseHike", async ({
      setTranslations,
      setCurrentLanguage,
      renderRoute,
      genericContentMock,
    }) => {
      setTranslations("en", "guides", {
        "content.sunriseHike.intro": ENGLISH_INTRO,
        "content.sunriseHike.sections": [ENGLISH_SECTION],
        "content.sunriseHike.faqs": [],
      });

      setTranslations("fr", "guides", {
        "content.sunriseHike.intro": [],
        "content.sunriseHike.sections": [],
        "content.sunriseHike.faqs": [],
      });

      setCurrentLanguage("fr");

      await renderRoute({ lang: "fr", route: "/fr/guides/sunrise-hike-positano" });

      const genericCall = genericContentMock.mock.calls.at(-1)?.[0];
      expect(genericCall?.guideKey).toBe("sunriseHike");

      const translator = genericCall?.t as
        | ((key: string, options?: Record<string, unknown>) => unknown)
        | undefined;
      expect(typeof translator).toBe("function");

      const resolvedIntro = translator?.(`content.sunriseHike.intro`, { returnObjects: true });
      expect(resolvedIntro).toEqual(ENGLISH_INTRO);
    });
  });

  it("omits structured content when neither locale nor English provide copy", async () => {
    await withGuideMocks("sunriseHike", async ({
      setTranslations,
      setCurrentLanguage,
      renderRoute,
      genericContentMock,
    }) => {
      setTranslations("en", "guides", {
        "content.sunriseHike.intro": [],
        "content.sunriseHike.sections": [],
        "content.sunriseHike.faqs": [],
      });

      setTranslations("fr", "guides", {
        "content.sunriseHike.intro": [],
        "content.sunriseHike.sections": [],
        "content.sunriseHike.faqs": [],
      });

      setCurrentLanguage("fr");

      await renderRoute({ lang: "fr", route: "/fr/guides/sunrise-hike-positano" });

      const translatorFr = createTranslator("fr", ["guides"]);
      expect(translatorFr("content.sunriseHike.intro", { returnObjects: true })).toEqual([]);

      const translatorEn = createTranslator("en", ["guides"]);
      expect(translatorEn("content.sunriseHike.intro", { returnObjects: true })).toEqual([]);

      expect(
        genericContentMock.mock.calls.some((call) => call?.[0]?.guideKey === "sunriseHike"),
      ).toBe(false);
    });
  });
});
