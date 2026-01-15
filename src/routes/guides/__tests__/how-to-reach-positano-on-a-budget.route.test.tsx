import { beforeEach, describe, expect, it } from "vitest";
import { renderGuideRoute } from "@tests/guides/harness";
import { resetGuideTemplateSpy, getGuideTemplateProps } from "@tests/guides/template-spy";

import {
  ALSO_HELPFUL_TAGS,
  GUIDE_KEY,
  OG_IMAGE,
  RELATED_GUIDES,
} from "@/routes/guides/how-to-reach-positano-on-a-budget.constants";
import { renderArticleLead } from "@/routes/guides/how-to-reach-positano-on-a-budget.articleLead";
import {
  buildBreadcrumb,
  buildHowToSteps,
  buildTocItems,
  guideFaqFallback,
} from "@/routes/guides/how-to-reach-positano-on-a-budget.schema";

describe("how-to-reach-positano-on-a-budget route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("forwards bespoke template props", async () => {
    const { props } = await renderGuideRoute(
      "@/routes/guides/how-to-reach-positano-on-a-budget",
      "/en/guides/how-to-reach-positano-on-a-budget",
    );
    if (!props) {
      throw new Error("Guide template props missing");
    }

    expect(props).toMatchObject({
      guideKey: GUIDE_KEY,
      metaKey: GUIDE_KEY,
      ogImage: OG_IMAGE,
      renderGenericContent: false,
      relatedGuides: {
        items: RELATED_GUIDES.map(({ key }) => ({ key })),
      },
      alsoHelpful: {
        tags: Array.from(ALSO_HELPFUL_TAGS),
        excludeGuide: Array.from(RELATED_GUIDES, (item) => item.key),
        includeRooms: true,
      },
    });

    expect(props.articleLead).toBe(renderArticleLead);
    expect(props.buildTocItems).toBe(buildTocItems);
    expect(props.buildHowToSteps).toBe(buildHowToSteps);
    expect(props.guideFaqFallback).toBe(guideFaqFallback);
    expect(props.buildBreadcrumb).toBe(buildBreadcrumb);

    const templateProps = getGuideTemplateProps<Record<string, unknown>>();
    expect(templateProps?.guideKey).toBe(GUIDE_KEY);
    expect(templateProps?.alsoHelpful).toEqual(
      expect.objectContaining({
        tags: Array.from(ALSO_HELPFUL_TAGS),
        excludeGuide: Array.from(RELATED_GUIDES, (item) => item.key),
        includeRooms: true,
      }),
    );
  });
});