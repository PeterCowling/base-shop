import { beforeEach, describe, expect, it } from "vitest";

import {
  genericContentMock,
  resetGuideTestState,
  renderWithRouter,
  setCurrentLanguage,
  setTranslations,
} from "./guides.test-utils";
import CampingOnTheAmalfiCoast from "../camping-on-the-amalfi-coast";

describe("camping-on-the-amalfi-coast translations", () => {
  beforeEach(() => {
    resetGuideTestState();
  });

  it("falls back to English structured content when the local guide bundle is empty", () => {
    setCurrentLanguage("pt");
    setTranslations("pt", "guides", {
      "content.campingAmalfi.seo.title": "Campismo",
      "content.campingAmalfi.seo.description": "Desc",
      "content.campingAmalfi.intro": [],
      "content.campingAmalfi.sections": [],
      "content.campingAmalfi.faqs": [],
    });
    setTranslations("en", "guides", {
      "content.campingAmalfi.intro": ["Intro"],
    });

    renderWithRouter(<CampingOnTheAmalfiCoast />);

    const { t } = genericContentMock.mock.calls.at(-1)?.[0] ?? { t: undefined };
    expect(typeof t).toBe("function");
    if (typeof t === "function") {
      expect(
        t("content.campingAmalfi.intro", { returnObjects: true, defaultValue: [] as string[] }),
      ).toEqual(["Intro"]);
    }
  });
});