import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/driving-the-amalfi-coast-tips";
const ROUTE = "/en/guides/driving-the-amalfi-coast-tips";

describe("driving-the-amalfi-coast-tips route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("uses manifest-driven template configuration", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<any>();
    expect(props.guideKey).toBe("drivingAmalfi");
    expect(props.metaKey).toBe("drivingAmalfi");
    expect(props.includeHowToStructuredData).toBe(true);
    expect(props.relatedGuides?.items).toEqual([
      { key: "transportBudget" },
      { key: "publicTransportAmalfi" },
      { key: "salernoPositano" },
    ]);
    expect(props.alsoHelpful).toMatchObject({
      tags: ["transport", "car", "positano", "planning"],
      includeRooms: true,
    });
    expect(props.genericContentOptions).toMatchObject({ contentKey: "drivingAmalfi", showToc: true });
  });
});