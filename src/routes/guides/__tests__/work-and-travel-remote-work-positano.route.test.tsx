import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/work-and-travel-remote-work-positano";
const ROUTE = "/fr/guides/work-and-travel-remote-work-positano";

describe("work-and-travel-remote-work-positano route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("passes og image and related guide metadata to GuideSeoTemplate", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      ogImage?: { path: string; width: number; height: number };
      relatedGuides?: { items: Array<{ key: string }> };
    }>();

    expect(props?.guideKey).toBe("workAndTravelPositano");
    expect(props?.metaKey).toBe("workAndTravelPositano");
    expect(props?.ogImage).toMatchObject({
      path: "/img/hostel-communal-terrace-lush-view.webp",
      width: 1200,
      height: 630,
    });
    expect(props?.relatedGuides?.items).toEqual([
      { key: "workCafes" },
      { key: "workExchangeItaly" },
      { key: "ecoFriendlyAmalfi" },
    ]);
  });
});