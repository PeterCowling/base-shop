import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/salerno-to-positano";
const ROUTE = "/en/guides/salerno-to-positano";

describe("salerno-to-positano route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("passes manifest-driven props to GuideSeoTemplate", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<Record<string, unknown>>();
    expect(props).toMatchObject({
      guideKey: "salernoPositano",
      metaKey: "salernoPositano",
      ogImage: {
        path: "/img/positano-panorama.avif",
        width: 1200,
        height: 630,
        transform: { width: 1200, height: 630, quality: 85, format: "auto" },
      },
      alsoHelpful: {
        tags: ["transport", "salerno", "positano", "ferry", "bus"],
        excludeGuide: ["ferrySchedules", "reachBudget", "luggageStorage"],
        includeRooms: true,
      },
      relatedGuides: {
        items: [
          { key: "ferrySchedules" },
          { key: "reachBudget" },
          { key: "luggageStorage" },
        ],
      },
    });
  });

  it("exposes the expected tags handle", async () => {
    const module = await import(MODULE_PATH);
    expect(module.handle.tags).toEqual(["transport", "salerno", "positano", "ferry", "bus"]);
  });
});