import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "@tests/renderers";
import { resetGuideTemplateSpy, getGuideTemplateProps } from "@tests/guides/template-spy";

async function renderRoute(modulePath: string, route: string) {
  const { default: Route } = await import(/* @vite-ignore */ modulePath);
  const utils = renderWithProviders(<Route />, { route });
  const props = getGuideTemplateProps<Record<string, unknown>>();
  if (!props) throw new Error("GuideSeoTemplate props were not captured – is the template mocked?");
  return { ...utils, props };
}

describe("naples-city-guide-for-amalfi-travelers route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("delegates to the guide template with Naples specific configuration", async () => {
    const { props, unmount } = await renderRoute(
      "@/routes/guides/naples-city-guide-for-amalfi-travelers",
      "/en/guides/naples-city-guide-for-amalfi-travelers",
    );

    expect(props.guideKey).toBe("naplesCityGuide");
    expect(props.metaKey).toBe("naplesCityGuide");
    expect(props.relatedGuides?.items).toEqual([
      { key: "reachBudget" },
      { key: "foodieGuideNaplesAmalfi" },
    ]);

    unmount();
  });
});
