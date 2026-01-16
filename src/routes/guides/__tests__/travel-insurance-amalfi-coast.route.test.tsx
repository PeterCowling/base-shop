import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/travel-insurance-amalfi-coast";
const ROUTE = "/en/guides/travel-insurance-amalfi-coast";

describe("travel-insurance-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("passes template options for generic rendering and related guides", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      renderGenericWhenEmpty?: boolean;
      suppressUnlocalizedFallback?: boolean;
      relatedGuides?: { items: Array<{ key: string }> };
    }>();

    expect(props?.guideKey).toBe("travelInsuranceAmalfi");
    expect(props?.metaKey).toBe("travelInsuranceAmalfi");
    expect(props?.renderGenericWhenEmpty).toBe(true);
    expect(props?.suppressUnlocalizedFallback).toBe(true);
    expect(props?.relatedGuides?.items).toEqual([
      { key: "pathOfTheGods" },
      { key: "positanoTravelGuide" },
    ]);
  });
});