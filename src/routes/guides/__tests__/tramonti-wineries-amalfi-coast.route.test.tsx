import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/tramonti-wineries-amalfi-coast";
const ROUTE = "/en/guides/tramonti-wineries-amalfi-coast";

describe("tramonti-wineries-amalfi-coast route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("forwards og image and related guide metadata", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      ogImage?: { path: string; width: number; height: number };
      relatedGuides?: { items: Array<{ key: string }> };
    }>();

    expect(props?.guideKey).toBe("tramontiWineries");
    expect(props?.metaKey).toBe("tramontiWineries");
    expect(props?.ogImage).toMatchObject({
      path: "/img/hostel-communal-terrace-lush-view.webp",
      width: 1200,
      height: 630,
    });
    expect(props?.relatedGuides?.items ?? []).toHaveLength(0);
  });
});