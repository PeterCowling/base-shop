import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/top-viewpoints-amalfi-coast";
const ROUTE = "/en/guides/top-viewpoints-amalfi-coast";

describe("top-viewpoints-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("configures related guides, FAQ fallback, and article extras", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      relatedGuides?: { items: Array<{ key: string }> };
      alwaysProvideFaqFallback?: boolean;
      articleExtras?: unknown;
    }>();

    expect(props?.guideKey).toBe("topViewpointsAmalfi");
    expect(props?.metaKey).toBe("topViewpointsAmalfi");
    expect(props?.relatedGuides?.items).toEqual([
      { key: "sunsetViewpoints" },
      { key: "instagramSpots" },
      { key: "positanoTravelGuide" },
    ]);
    expect(props?.alwaysProvideFaqFallback).toBe(true);
    expect(typeof props?.articleExtras).toBe("function");
  });
});