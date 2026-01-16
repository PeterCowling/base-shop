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

describe("positano-dining-guide route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("enables generic fallbacks for dining content", async () => {
    const { props, unmount } = await renderRoute(
      "@/routes/guides/positano-dining-guide",
      "/en/guides/positano-dining-guide",
    );

    expect(props.guideKey).toBe("positanoDining");
    expect(props.metaKey).toBe("positanoDining");
    expect(props.renderGenericWhenEmpty).toBe(true);
    expect(props.preferGenericWhenFallback).toBe(true);
    expect(props.relatedGuides?.items).toEqual([
      { key: "limoncelloCuisine" },
      { key: "cheapEats" },
      { key: "boatTours" },
    ]);

    unmount();
  });
});
