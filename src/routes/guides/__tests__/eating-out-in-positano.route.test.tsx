import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/eating-out-in-positano";
const ROUTE = "/en/guides/eating-out-in-positano";

describe("eating-out-in-positano route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("configures GuideSeoTemplate with fallback options for sparse localization", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<any>();
    expect(props).toMatchObject({
      guideKey: "eatingOutPositano",
      metaKey: "eatingOutPositano",
      renderGenericWhenEmpty: true,
      alwaysProvideFaqFallback: true,
      showPlanChoice: false,
      showTransportNotice: false,
      relatedGuides: {
        items: [{ key: "cheapEats" }, { key: "limoncelloCuisine" }, { key: "positanoBudget" }],
      },
    });
  });
});