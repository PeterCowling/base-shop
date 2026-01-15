import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/day-trips-from-positano";
const ROUTE = "/en/guides/day-trips-from-positano";

describe("day-trips-from-positano route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("passes manifest-derived props to GuideSeoTemplate", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<any>();
    expect(props).toMatchObject({
      guideKey: "dayTripsAmalfi",
      metaKey: "dayTripsAmalfi",
      renderGenericWhenEmpty: true,
      relatedGuides: {
        items: [
          { key: "capriDayTrip" },
          { key: "positanoPompeii" },
          { key: "positanoAmalfi" },
        ],
      },
    });
  });
});