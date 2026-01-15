import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/traveling-with-pets-amalfi-coast";
const ROUTE = "/en/guides/traveling-with-pets-amalfi-coast";

describe("traveling-with-pets-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("forwards manifest-driven props to GuideSeoTemplate", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      showRelatedWhenLocalized?: boolean;
      relatedGuides?: { items: Array<{ key: string }> };
    }>();

    expect(props?.guideKey).toBe("petsAmalfi");
    expect(props?.metaKey).toBe("petsAmalfi");
    expect(props?.showRelatedWhenLocalized).toBe(false);
    expect(props?.relatedGuides?.items).toEqual([
      { key: "ecoFriendlyAmalfi" },
      { key: "safetyAmalfi" },
      { key: "workAndTravelPositano" },
    ]);
  });
});