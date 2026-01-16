import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const MODULE_PATH = "@/routes/guides/regina-giovanna-bath-beach-guide";
const ROUTE = "/en/guides/regina-giovanna-bath-beach-guide";

describe("regina-giovanna-bath-beach-guide route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("passes og image, related guides, and helper options to GuideSeoTemplate", async () => {
    await renderGuideRoute(MODULE_PATH, ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      ogImage?: { path: string; width: number; height: number };
      relatedGuides?: { items: Array<{ key: string }> };
      preferGenericWhenFallback?: boolean;
      showTagChips?: boolean;
      showPlanChoice?: boolean;
    }>();

    expect(props?.guideKey).toBe("reginaGiovannaBath");
    expect(props?.metaKey).toBe("reginaGiovannaBath");

    expect(props?.preferGenericWhenFallback).toBe(true);
    expect(props?.showTagChips).toBe(true);
    expect(props?.showPlanChoice).toBe(true);
  });
});