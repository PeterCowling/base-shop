// Mock i18next before importing the module under test
const store: Record<string, Record<string, unknown>> = {};

jest.mock("i18next", () => ({
  __esModule: true,
  default: {
    getResourceBundle: (lang: string, ns: string) => store[`${lang}/${ns}`],
  },
}));

import { extractGuideBundle } from "@/utils/extractGuideBundle";

function seed(lang: string, ns: string, data: Record<string, unknown>) {
  store[`${lang}/${ns}`] = data;
}

afterEach(() => {
  for (const key of Object.keys(store)) delete store[key];
});

describe("extractGuideBundle", () => {
  it("returns shared keys + only the current guide content", () => {
    seed("en", "guides", {
      components: { planChoice: { title: "Choose your plan" } },
      transportNotice: { items: { buses: "Buses run hourly" } },
      labels: { relatedGuides: "Related guides" },
      content: {
        positanoMainBeach: { intro: ["Beach intro"], seo: { title: "Beach" } },
        pathOfTheGods: { intro: ["Hike intro"] },
      },
    });

    const result = extractGuideBundle("en", "positanoMainBeach");

    expect(result).toBeDefined();
    expect(result!.components).toEqual({ planChoice: { title: "Choose your plan" } });
    expect(result!.transportNotice).toEqual({ items: { buses: "Buses run hourly" } });
    expect(result!.labels).toEqual({ relatedGuides: "Related guides" });
    expect(result!.content).toEqual({
      positanoMainBeach: { intro: ["Beach intro"], seo: { title: "Beach" } },
    });
  });

  it("does NOT include other guide content keys", () => {
    seed("en", "guides", {
      labels: { backLink: "Back" },
      content: {
        positanoMainBeach: { intro: ["Beach intro"] },
        pathOfTheGods: { intro: ["Hike intro"] },
        sunriseHike: { intro: ["Sunrise intro"] },
      },
    });

    const result = extractGuideBundle("en", "positanoMainBeach");

    expect(result).toBeDefined();
    expect(Object.keys(result!.content as Record<string, unknown>)).toEqual([
      "positanoMainBeach",
    ]);
    expect((result!.content as Record<string, unknown>).pathOfTheGods).toBeUndefined();
    expect((result!.content as Record<string, unknown>).sunriseHike).toBeUndefined();
  });

  it("returns shared keys with empty content for non-existent guide key", () => {
    seed("en", "guides", {
      labels: { backLink: "Back" },
      content: {
        positanoMainBeach: { intro: ["Beach intro"] },
      },
    });

    const result = extractGuideBundle("en", "nonExistentKey");

    expect(result).toBeDefined();
    expect(result!.labels).toEqual({ backLink: "Back" });
    expect(result!.content).toEqual({});
  });

  it("returns undefined when i18n store is empty", () => {
    // store is empty — no seed call
    const result = extractGuideBundle("en", "positanoMainBeach");
    expect(result).toBeUndefined();
  });
});
