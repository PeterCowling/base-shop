import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/transport-on-a-budget-amalfi-coast";
const ROUTE = "/en/guides/transport-on-a-budget-amalfi-coast";

describe("transport-on-a-budget-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("forwards og image and related guide props to the template", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      ogImage?: { path: string; width: number; height: number; transform?: Record<string, unknown> };
      relatedGuides?: { items: Array<{ key: string }> };
    }>();

    expect(props?.guideKey).toBe("transportBudget");
    expect(props?.metaKey).toBe("transportBudget");
    expect(props?.ogImage).toMatchObject({
      path: "/img/positano-panorama.avif",
      width: 1200,
      height: 630,
      transform: { width: 1200, height: 630, quality: 85, format: "auto" },
    });
    expect(props?.relatedGuides?.items).toEqual([
      { key: "reachBudget" },
      { key: "howToGetToPositano" },
      { key: "salernoVsNaplesArrivals" },
    ]);
  });
});