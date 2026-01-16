import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/top-of-the-mountain-hike";
const ROUTE = "/en/guides/top-of-the-mountain-hike";

describe("top-of-the-mountain-hike route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("provides og image metadata and fallback gallery extras", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      ogImage?: { path: string; width: number; height: number };
      articleExtras?: unknown;
    }>();

    expect(props?.guideKey).toBe("topOfTheMountainHike");
    expect(props?.metaKey).toBe("topOfTheMountainHike");
    expect(props?.ogImage).toMatchObject({
      path: "/img/hostel-communal-terrace-lush-view.webp",
      width: 1200,
      height: 630,
    });
    expect(typeof props?.articleExtras).toBe("function");
  });
});